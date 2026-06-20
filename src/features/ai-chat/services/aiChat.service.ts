import { HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import type { Response } from 'express'
import { AiService } from '../../../shared/services/ai.service'
import { AiChatRepository } from '../repositories/aiChat.repository'
import type { SaveAiChatDto } from '../dto/aiChat.dto'

const CHAT_DEDUCTION = 50
const SCORE_THRESHOLD = 0.3

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name)

  constructor(
    private readonly aiChatRepository: AiChatRepository,
    private readonly aiService: AiService,
  ) {}

  async storeAiChatStream(dto: SaveAiChatDto, userId: string, res: Response) {
    try {
      const { message, senderName } = dto

      let userBalance = await this.aiChatRepository.findUserBalance(userId)
      if (!userBalance) userBalance = await this.aiChatRepository.createUserBalance(userId)

      if (userBalance.balance <= 0) {
        throw new HttpException(
          {
            code: 'BALANCE_EMPTY',
            message: 'Saldo AI Anda habis.',
            upsell: 'Top-up saldo mulai Rp 20.000 untuk melanjutkan layanan chatbot.',
          },
          HttpStatus.PAYMENT_REQUIRED,
        )
      }

      const queryEmbedding = await this.aiService.getEmbedding(message)
      const queryVectorStr = `[${queryEmbedding.join(',')}]`

      const [faqRows, sopRows] = await Promise.all([
        this.aiChatRepository.findFaqByEmbedding(userId, queryVectorStr),
        this.aiChatRepository.findSopByEmbedding(userId, queryVectorStr),
      ])

      const relevantFaq = faqRows.filter((r) => r.score >= SCORE_THRESHOLD)
      const relevantSop = sopRows.filter((r) => r.score >= SCORE_THRESHOLD)

      const contextParts: string[] = []
      if (relevantFaq.length > 0) {
        const faqLines = relevantFaq.map((f) => `T: ${f.question}\nJ: ${f.answer}`).join('\n\n')
        contextParts.push(`FAQ:\n${faqLines}`)
      }
      if (relevantSop.length > 0) {
        contextParts.push(`Dokumen SOP:\n${relevantSop.map((s) => s.content).join('\n\n')}`)
      }
      const fullContext = contextParts.length > 0 ? contextParts.join('\n\n---\n\n') : 'Tidak ada konteks tersedia.'

      const systemPrompt = `Anda adalah asisten AI untuk toko ini. Jawab pertanyaan pelanggan hanya berdasarkan informasi di bawah. Jika tidak ada informasinya, sampaikan bahwa tim kami akan menghubungi segera.\n\nKonteks:\n${fullContext}`

      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')

      const stream = await this.aiService.deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 512,
        stream: true,
      })

      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`)
      }

      const balanceBefore = userBalance.balance
      const balanceAfter = Math.max(0, balanceBefore - CHAT_DEDUCTION)
      await this.aiChatRepository.updateBalanceAndLog(userId, balanceBefore, balanceAfter, CHAT_DEDUCTION, senderName)

      res.write(`data: ${JSON.stringify({ done: true, balanceAfter, deduction: CHAT_DEDUCTION })}\n\n`)
      res.end()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to store AI chat stream', error)
      throw new InternalServerErrorException('Failed to process AI chat')
    }
  }
}
