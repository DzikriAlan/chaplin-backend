import * as crypto from 'node:crypto'
import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import type { Response } from 'express'
import { AiService } from '../../../shared/services/ai.service'
import { ChatRepository } from '../repositories/chat.repository'
import type { SaveChatDto, PatchChatSessionsDto } from '../dto/chat.dto'

const SCORE_THRESHOLD = 0.3
const CACHE_THRESHOLD = 0.88
const MAX_TEXT_FILE_CHARS = 4000

interface FilePayload {
  name: string
  type: string
  size: number
  base64: string
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name)

  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly aiService: AiService,
  ) {}

  async getChat(sessionId: string) {
    try {
      return await this.chatRepository.findChatHistoryBySession(sessionId)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get chat', error)
      throw new InternalServerErrorException('Failed to get chat history')
    }
  }

  async getChatSessions() {
    try {
      return await this.chatRepository.findChatSessions()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get chat sessions', error)
      throw new InternalServerErrorException('Failed to get chat sessions')
    }
  }

  async changeChatSession(dto: PatchChatSessionsDto) {
    try {
      return await this.chatRepository.upsertChatSession(dto.sessionId, dto.title)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to change chat session', error)
      throw new InternalServerErrorException('Failed to update chat session')
    }
  }

  async removeChatSession(sessionId: string) {
    try {
      await this.chatRepository.deleteChatSession(sessionId)
      return { success: true }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to remove chat session', error)
      throw new InternalServerErrorException('Failed to remove chat session')
    }
  }

  async storeChatStream(dto: SaveChatDto, res: Response) {
    try {
      const { message, sessionId, docs, files, agentId } = dto

      let agentKbIds: string[] = []
      let agentPersonalization: string | null = null
      if (agentId) {
        const agent = await this.chatRepository.findAgentById(agentId)
        if (agent) {
          agentKbIds = agent.knowledgeBaseIds
          agentPersonalization = agent.personalization
        }
      }

      await this.chatRepository.createChatHistory(sessionId, 'user', message)

      let queryVectorStr: string | null = null
      try {
        const queryEmbedding = await this.aiService.getEmbedding(message)
        queryVectorStr = `[${queryEmbedding.join(',')}]`
      } catch {
        this.logger.warn('Embedding unavailable, proceeding without vector search')
      }
      const questionHash = crypto.createHash('sha256').update(message.trim().toLowerCase()).digest('hex')
      const hasFiles = files && files.length > 0

      const cached = queryVectorStr ? await this.checkCache(questionHash, queryVectorStr, hasFiles, !!agentId) : null

      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')

      if (cached) {
        const cachedSources = (cached.sources as Record<string, unknown>[]) ?? []
        await this.chatRepository.createChatHistory(sessionId, 'assistant', cached.answer, cachedSources)
        res.write(`data: ${JSON.stringify({ text: cached.answer })}\n\n`)
        res.write(`data: ${JSON.stringify({ done: true, sources: cachedSources })}\n\n`)
        res.end()
        return
      }

      await this.processAndStream({
        res,
        sessionId,
        message,
        files: files ?? [],
        queryVectorStr,
        questionHash,
        hasFiles: !!hasFiles,
        docs,
        agentKbIds,
        agentPersonalization,
      })
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to store chat stream', error)
      throw new InternalServerErrorException('Failed to process chat')
    }
  }

  private async checkCache(questionHash: string, queryVectorStr: string, hasFiles: boolean | undefined, hasAgent: boolean) {
    if (hasFiles || hasAgent) return null
    const exactHit = await this.chatRepository.findCacheExact(questionHash)
    if (exactHit) return { answer: exactHit.answer, sources: exactHit.sources }
    const hits = await this.chatRepository.findCacheSemantic(queryVectorStr)
    const semanticHit = hits[0]
    if (semanticHit && semanticHit.score >= CACHE_THRESHOLD) return { answer: semanticHit.answer, sources: semanticHit.sources }
    return null
  }

  private decodeBase64Text(base64: string): string {
    try {
      return Buffer.from(base64, 'base64').toString('utf-8').slice(0, MAX_TEXT_FILE_CHARS)
    } catch {
      return ''
    }
  }

  private buildFileContext(files: FilePayload[]): string {
    if (!files || files.length === 0) return ''
    const parts: string[] = []
    for (const f of files) {
      if (f.type.startsWith('image/')) {
        parts.push(`[Gambar: ${f.name}]`)
      } else {
        const text = this.decodeBase64Text(f.base64)
        if (text) parts.push(`[File: ${f.name}]\n${text}`)
        else parts.push(`[File: ${f.name} (binary)]`)
      }
    }
    return parts.join('\n\n')
  }

  private fetchKnowledgeBaseByVector(queryVectorStr: string, agentKbIds: string[]) {
    if (agentKbIds.length > 0) return this.chatRepository.findKnowledgeBaseByEmbeddingFiltered(queryVectorStr, agentKbIds)
    return this.chatRepository.findKnowledgeBaseByEmbedding(queryVectorStr)
  }

  private async fetchContextRows(queryVectorStr: string | null, docs: string[] | undefined, agentKbIds: string[]) {
    const docQuery = queryVectorStr ? this.chatRepository.findDocChunksByEmbedding(queryVectorStr, docs) : Promise.resolve([])
    const kbQuery = queryVectorStr ? this.fetchKnowledgeBaseByVector(queryVectorStr, agentKbIds) : Promise.resolve([])
    const fallbackQuery = agentKbIds.length > 0
      ? this.chatRepository.findKnowledgeBaseFallbackFiltered(agentKbIds)
      : this.chatRepository.findKnowledgeBaseFallback()
    return Promise.all([docQuery, kbQuery, fallbackQuery])
  }

  private async processAndStream(opts: {
    res: Response
    sessionId: string
    message: string
    files: FilePayload[]
    queryVectorStr: string | null
    questionHash: string
    hasFiles: boolean
    docs?: string[]
    agentKbIds: string[]
    agentPersonalization: string | null
  }) {
    const { res, sessionId, message, files, queryVectorStr, questionHash, hasFiles, docs, agentKbIds, agentPersonalization } = opts

    const [docRows, faqVecRows, faqFallback] = await this.fetchContextRows(queryVectorStr, docs, agentKbIds)

    const relevantChunks = docRows.filter((c) => c.score >= SCORE_THRESHOLD)
    const relevantFaq = [
      ...faqVecRows.filter((f) => f.score >= SCORE_THRESHOLD).map(({ question, answer }) => ({ question, answer })),
      ...faqFallback,
    ]

    const docContext = relevantChunks.map((c) => c.content).join('\n\n')
    const faqContext = relevantFaq.map((f) => `T: ${f.question}\nJ: ${f.answer}`).join('\n\n')
    const fileContext = this.buildFileContext(files)

    const contextParts: string[] = []
    if (docContext) contextParts.push(`Dokumen:\n${docContext}`)
    if (faqContext) contextParts.push(`FAQ:\n${faqContext}`)
    if (fileContext) contextParts.push(`File yang diupload:\n${fileContext}`)
    const fullContext = contextParts.length > 0 ? contextParts.join('\n\n---\n\n') : 'Tidak ada konteks yang tersedia.'

    const personalizationPrefix = agentPersonalization ? agentPersonalization + '\n\n' : ''
    const systemPrompt = `${personalizationPrefix}Asisten AI. Jawab hanya dari konteks berikut. Jika tidak ada informasinya, katakan tidak tahu. Bahasa sesuai pengguna.\n\nKonteks:\n${fullContext}`

    const history = await this.chatRepository.findChatHistoryRecent(sessionId, 6)

    const imageFiles = files.filter((f) => f.type.startsWith('image/'))
    const isMultimodal = imageFiles.length > 0

    type TextContent = { type: 'text'; text: string }
    type ImageContent = { type: 'image_url'; image_url: { url: string } }
    type MessageContent = string | Array<TextContent | ImageContent>

    let userMessageContent: MessageContent
    if (isMultimodal) {
      const contentParts: Array<TextContent | ImageContent> = [{ type: 'text', text: message }]
      for (const img of imageFiles) {
        contentParts.push({ type: 'image_url', image_url: { url: `data:${img.type};base64,${img.base64}` } })
      }
      userMessageContent = contentParts
    } else {
      userMessageContent = message
    }

    const validHistory = history.filter((h) => typeof h.content === 'string' && h.content.length > 0)

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...validHistory.slice(0, -1).map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: userMessageContent },
    ]

    const maxTokens = isMultimodal ? 2048 : 1024
    const stream = await this.aiService.deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: messages as never,
      max_tokens: maxTokens,
      stream: true,
    })

    let fullContent = ''
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? ''
      if (text) {
        fullContent += text
        res.write(`data: ${JSON.stringify({ text })}\n\n`)
      }
    }

    const sources = relevantChunks.map((c) => ({
      content: c.content.slice(0, 200),
      metadata: c.metadata as Record<string, unknown>,
    }))

    await Promise.all([
      this.chatRepository.createChatHistory(sessionId, 'assistant', fullContent, sources),
      hasFiles ? Promise.resolve() : this.chatRepository.createChatCache(questionHash, message, fullContent, sources, queryVectorStr),
    ])

    res.write(`data: ${JSON.stringify({ done: true, sources })}\n\n`)
    res.end()
  }
}
