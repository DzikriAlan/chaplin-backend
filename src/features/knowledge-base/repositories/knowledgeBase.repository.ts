import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'
import type { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from '../dto/knowledgeBase.dto'

@Injectable()
export class KnowledgeBaseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findKnowledgeBaseMany() {
    try {
      return await this.prisma.knowledgeBase.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } })
    } catch (error) {
      throw handlePrismaError(error, 'knowledge-base')
    }
  }

  async createKnowledgeBase(dto: CreateKnowledgeBaseDto) {
    try {
      return await this.prisma.knowledgeBase.create({ data: { question: dto.question, answer: dto.answer, tags: dto.tags ?? [] } })
    } catch (error) {
      throw handlePrismaError(error, 'knowledge-base')
    }
  }

  async updateKnowledgeBaseEmbedding(id: string, vectorStr: string) {
    try {
      return await this.prisma.$executeRaw`UPDATE "knowledge_base" SET embedding = ${vectorStr}::vector(1024) WHERE id = ${id}`
    } catch (error) {
      throw handlePrismaError(error, 'knowledge-base')
    }
  }

  async updateKnowledgeBase(id: string, dto: UpdateKnowledgeBaseDto) {
    try {
      return await this.prisma.knowledgeBase.update({ where: { id }, data: { question: dto.question, answer: dto.answer, tags: dto.tags } })
    } catch (error) {
      throw handlePrismaError(error, 'knowledge-base')
    }
  }

  async updateKnowledgeBaseActive(id: string, isActive: boolean) {
    try {
      return await this.prisma.knowledgeBase.update({ where: { id }, data: { isActive } })
    } catch (error) {
      throw handlePrismaError(error, 'knowledge-base')
    }
  }

  async deleteChatCache() {
    try {
      return await this.prisma.chatCache.deleteMany({})
    } catch (error) {
      throw handlePrismaError(error, 'knowledge-base')
    }
  }
}
