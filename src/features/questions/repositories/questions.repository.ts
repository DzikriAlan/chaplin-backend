import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'

interface GeneratedQuestionData {
  topic: string
  type: string
  question: string
  options?: string[]
  answer: string
  discussion?: string | null
}

@Injectable()
export class QuestionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findQuestionsMany(topic?: string) {
    try {
      const where = topic ? { topic: { contains: topic } } : {}
      return await this.prisma.generatedQuestion.findMany({ where, orderBy: { createdAt: 'desc' } })
    } catch (error) {
      throw handlePrismaError(error, 'question')
    }
  }

  async findTopChunksByEmbedding(vectorStr: string) {
    try {
      return await this.prisma.$queryRaw<Array<{ content: string }>>`
        SELECT content FROM "document_chunks"
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorStr}::vector(1024)
        LIMIT 8
      `
    } catch (error) {
      throw handlePrismaError(error, 'question')
    }
  }

  async createQuestionsMany(data: GeneratedQuestionData[]) {
    try {
      return await Promise.all(
        data.map((q) =>
          this.prisma.generatedQuestion.create({
            data: {
              topic: q.topic,
              type: q.type,
              question: q.question,
              options: q.options ?? undefined,
              answer: q.answer,
              discussion: q.discussion ?? null,
            },
          }),
        ),
      )
    } catch (error) {
      throw handlePrismaError(error, 'question')
    }
  }
}
