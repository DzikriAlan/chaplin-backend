import { Injectable, Logger } from '@nestjs/common'
import type { Response } from 'express'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { AiService } from '../../../shared/services/ai.service'
import type { ChatDto } from '../dto/chat.dto'

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async streamChat(dto: ChatDto, res: Response): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders()

    try {
      const agent = await this.prisma.agent.findUnique({ where: { id: dto.agentId } })

      let contextText = ''
      if (agent?.knowledgeBaseIds?.length) {
        const kbItems = await this.prisma.knowledgeBase.findMany({
          where: { id: { in: agent.knowledgeBaseIds }, isActive: true },
          select: { question: true, answer: true },
        })
        contextText = kbItems.map((item) => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n')
      }

      const systemPrompt = [
        agent?.personalization ?? 'Kamu adalah asisten AI yang helpful dan ramah.',
        contextText ? `\n\nGunakan informasi berikut sebagai referensi:\n${contextText}` : '',
      ].join('')

      const history = await this.prisma.chatHistory.findMany({
        where: { sessionId: dto.sessionId },
        orderBy: { createdAt: 'asc' },
        take: 10,
        select: { role: true, content: true },
      })

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
        { role: 'user' as const, content: dto.message },
      ]

      await this.prisma.chatHistory.create({
        data: { sessionId: dto.sessionId, role: 'user', content: dto.message },
      })

      const stream = await this.aiService.deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages,
        stream: true,
      })

      let fullResponse = ''
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) {
          fullResponse += text
          res.write(`data: ${JSON.stringify({ text })}\n\n`)
        }
      }

      await this.prisma.chatHistory.create({
        data: { sessionId: dto.sessionId, role: 'assistant', content: fullResponse },
      })
    } catch (error) {
      this.logger.error('Chat stream error', error)
      res.write(`data: ${JSON.stringify({ text: 'Terjadi kesalahan, silakan coba lagi.' })}\n\n`)
    } finally {
      res.end()
    }
  }
}
