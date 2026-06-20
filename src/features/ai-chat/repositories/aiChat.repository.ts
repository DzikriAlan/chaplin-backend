import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'

interface FaqRow {
  question: string
  answer: string
  score: number
}

interface SopRow {
  content: string
  score: number
}

const CHUNK_LIMIT = 600

@Injectable()
export class AiChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserBalance(userId: string) {
    try {
      return await this.prisma.userBalance.findUnique({ where: { userId } })
    } catch (error) {
      throw handlePrismaError(error, 'user')
    }
  }

  async createUserBalance(userId: string) {
    try {
      return await this.prisma.userBalance.create({ data: { userId } })
    } catch (error) {
      throw handlePrismaError(error, 'user')
    }
  }

  async findFaqByEmbedding(userId: string, vectorStr: string): Promise<FaqRow[]> {
    try {
      return await this.prisma.$queryRaw<FaqRow[]>`
        SELECT question, answer,
               (1 - (embedding <=> ${vectorStr}::vector(1024)))::float8 AS score
        FROM faq_manager
        WHERE "userId" = ${userId} AND "isActive" = true AND embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorStr}::vector(1024)
        LIMIT 5
      `
    } catch (error) {
      throw handlePrismaError(error, 'faq-manager')
    }
  }

  async findSopByEmbedding(userId: string, vectorStr: string): Promise<SopRow[]> {
    try {
      return await this.prisma.$queryRaw<SopRow[]>`
        SELECT LEFT(content, ${CHUNK_LIMIT}::integer) AS content,
               (1 - (embedding <=> ${vectorStr}::vector(1024)))::float8 AS score
        FROM vectors_sop
        WHERE "userId" = ${userId} AND embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorStr}::vector(1024)
        LIMIT 5
      `
    } catch (error) {
      throw handlePrismaError(error, 'chat')
    }
  }

  async updateBalanceAndLog(userId: string, balanceBefore: number, balanceAfter: number, deduction: number, senderName: string | null | undefined) {
    try {
      return await this.prisma.$transaction([
        this.prisma.userBalance.update({ where: { userId }, data: { balance: balanceAfter } }),
        this.prisma.usageLog.create({
          data: {
            userId,
            activityType: 'chat',
            senderName: senderName ?? null,
            deduction,
            balanceBefore,
            balanceAfter,
          },
        }),
      ])
    } catch (error) {
      throw handlePrismaError(error, 'balance')
    }
  }
}
