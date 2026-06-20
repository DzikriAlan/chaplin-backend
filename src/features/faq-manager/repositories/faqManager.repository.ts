import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'
import type { CreateFaqManagerDto } from '../dto/faqManager.dto'

@Injectable()
export class FaqManagerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findFaqManagerByUser(userId: string) {
    try {
      return await this.prisma.faqManager.findMany({
        where: { userId, isActive: true },
        orderBy: { createdAt: 'desc' },
        select: { id: true, question: true, answer: true, isActive: true, createdAt: true, updatedAt: true },
      })
    } catch (error) {
      throw handlePrismaError(error, 'faq-manager')
    }
  }

  async countFaqManagerByUser(userId: string) {
    try {
      return await this.prisma.faqManager.count({ where: { userId, isActive: true } })
    } catch (error) {
      throw handlePrismaError(error, 'faq-manager')
    }
  }

  async createFaqManager(userId: string, dto: CreateFaqManagerDto) {
    try {
      return await this.prisma.faqManager.create({
        data: { userId, question: dto.question.trim(), answer: dto.answer.trim() },
      })
    } catch (error) {
      throw handlePrismaError(error, 'faq-manager')
    }
  }

  async updateFaqManagerEmbedding(id: string, vectorStr: string) {
    try {
      return await this.prisma.$executeRaw`UPDATE faq_manager SET embedding = ${vectorStr}::vector(1024) WHERE id = ${id}`
    } catch (error) {
      throw handlePrismaError(error, 'faq-manager')
    }
  }

  async findFaqManagerById(id: string, userId: string) {
    try {
      return await this.prisma.faqManager.findFirst({ where: { id, userId } })
    } catch (error) {
      throw handlePrismaError(error, 'faq-manager')
    }
  }

  async deleteFaqManager(id: string) {
    try {
      return await this.prisma.faqManager.delete({ where: { id } })
    } catch (error) {
      throw handlePrismaError(error, 'faq-manager')
    }
  }
}
