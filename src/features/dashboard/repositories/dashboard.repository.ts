import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDashboardStats() {
    try {
      const [documentCount, chunkCount, chatCount, questionCount, knowledgeCount] = await Promise.all([
        this.prisma.document.count(),
        this.prisma.documentChunk.count(),
        this.prisma.chatHistory.count({ where: { role: 'user' } }),
        this.prisma.generatedQuestion.count(),
        this.prisma.knowledgeBase.count({ where: { isActive: true } }),
      ])
      return { documentCount, chunkCount, chatCount, questionCount, knowledgeCount }
    } catch (error) {
      throw handlePrismaError(error, 'dashboard')
    }
  }
}
