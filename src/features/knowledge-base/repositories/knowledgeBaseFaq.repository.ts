import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'
import type { CreateFaqManagerDto, CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from '../dto/knowledgeBaseFaq.dto'

@Injectable()
export class KnowledgeBaseFaqRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Public Knowledge Base Methods ───────────────────────────────────────

  async findKnowledgeBaseMany() {
    try {
      return await this.prisma.knowledgeBase.findMany({
        where: { type: 'public', isActive: true },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async createKnowledgeBase(dto: CreateKnowledgeBaseDto) {
    try {
      return await this.prisma.knowledgeBase.create({
        data: {
          type: 'public',
          question: dto.question,
          answer: dto.answer,
          tags: dto.tags ?? [],
        },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async updateKnowledgeBaseEmbedding(id: string, vectorStr: string) {
    try {
      return await this.prisma.$executeRaw`UPDATE "knowledge_base" SET embedding = ${vectorStr}::vector(1024) WHERE id = ${id}`
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async updateKnowledgeBase(id: string, dto: UpdateKnowledgeBaseDto) {
    try {
      return await this.prisma.knowledgeBase.update({
        where: { id },
        data: {
          question: dto.question,
          answer: dto.answer,
          tags: dto.tags,
        },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async updateKnowledgeBaseActive(id: string, isActive: boolean) {
    try {
      return await this.prisma.knowledgeBase.update({
        where: { id },
        data: { isActive },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async deleteChatCache() {
    try {
      return await this.prisma.chatCache.deleteMany({})
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  // ─── FAQ Manager Methods ─────────────────────────────────────────────────

  async findFaqManagerMany(userId: string) {
    try {
      return await this.prisma.knowledgeBase.findMany({
        where: { type: 'faq', userId, isActive: true },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async createFaqManager(userId: string, dto: CreateFaqManagerDto) {
    try {
      return await this.prisma.knowledgeBase.create({
        data: {
          type: 'faq',
          userId,
          question: dto.question,
          answer: dto.answer,
          category: dto.category || null,
          isActive: true,
        },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async findFaqManagerById(id: string, userId: string) {
    try {
      return await this.prisma.knowledgeBase.findFirst({
        where: { id, type: 'faq', userId },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async deleteFaqManager(id: string, userId: string) {
    try {
      return await this.prisma.knowledgeBase.update({
        where: { id },
        data: { isActive: false },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }
}
