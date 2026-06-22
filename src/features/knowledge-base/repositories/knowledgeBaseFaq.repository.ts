import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'
import type { CreateFaqManagerDto, CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from '../dto/knowledgeBaseFaq.dto'

@Injectable()
export class KnowledgeBaseFaqRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Public Knowledge Base Methods ───────────────────────────────────────

  async getKnowledgeBaseMany() {
    try {
      return await this.prisma.knowledgeBase.findMany({
        where: { type: 'public', isActive: true },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async postKnowledgeBase(dto: CreateKnowledgeBaseDto) {
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

  async patchKnowledgeBaseEmbedding(id: string, vectorStr: string) {
    try {
      return await this.prisma.$executeRaw`UPDATE "knowledge_base" SET embedding = ${vectorStr}::vector(1024) WHERE id = ${id}`
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async patchKnowledgeBase(id: string, dto: UpdateKnowledgeBaseDto) {
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

  async patchKnowledgeBaseActive(id: string, isActive: boolean) {
    try {
      return await this.prisma.knowledgeBase.update({
        where: { id },
        data: { isActive },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async deleteKnowledgeBaseChat() {
    try {
      return await this.prisma.chatCache.deleteMany({})
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  // ─── FAQ Manager Methods ─────────────────────────────────────────────────

  async getFaqManagerMany(userId: string) {
    try {
      return await this.prisma.knowledgeBase.findMany({
        where: { type: 'faq', userId, isActive: true },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async postFaqManager(userId: string, dto: CreateFaqManagerDto) {
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

  async getFaqManagerById(id: string, userId: string) {
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
