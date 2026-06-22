import { Injectable, Logger, InternalServerErrorException, BadRequestException, HttpException } from '@nestjs/common'
import { KnowledgeBaseFaqRepository } from '../repositories/knowledgeBaseFaq.repository'
import { QueueService } from '../../../shared/queues/queue.service'
import type { CreateFaqManagerDto, CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from '../dto/knowledgeBaseFaq.dto'

@Injectable()
export class KnowledgeBaseFaqService {
  private readonly logger = new Logger(KnowledgeBaseFaqService.name)

  constructor(
    private readonly faqRepository: KnowledgeBaseFaqRepository,
    private readonly queueService: QueueService,
  ) {}

  // ─── Public Knowledge Base Methods ───────────────────────────────────────

  async fetchKnowledgeBaseList() {
    try {
      return await this.faqRepository.getKnowledgeBaseMany()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get knowledge base list', error)
      throw new InternalServerErrorException('Failed to get knowledge base list')
    }
  }

  async storeKnowledgeBase(dto: CreateKnowledgeBaseDto) {
    try {
      if (!dto.question || !dto.answer) throw new BadRequestException('Missing question or answer')
      const item = await this.faqRepository.postKnowledgeBase(dto)
      await this.queueService.enqueueKbEmbed(item.id, dto.question, dto.answer)
      await this.faqRepository.deleteKnowledgeBaseChat()
      return item
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to store knowledge base', error)
      throw new InternalServerErrorException('Failed to create knowledge base item')
    }
  }

  async changeKnowledgeBase(id: string, dto: UpdateKnowledgeBaseDto) {
    try {
      const item = await this.faqRepository.patchKnowledgeBase(id, dto)
      if (dto.question !== undefined || dto.answer !== undefined) {
        await this.queueService.enqueueKbEmbed(id, item.question, item.answer)
      }
      await this.faqRepository.deleteKnowledgeBaseChat()
      return item
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to change knowledge base', error)
      throw new InternalServerErrorException('Failed to update knowledge base item')
    }
  }

  async removeKnowledgeBase(id: string) {
    try {
      await this.faqRepository.patchKnowledgeBaseActive(id, false)
      await this.faqRepository.deleteKnowledgeBaseChat()
      return { success: true }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to remove knowledge base', error)
      throw new InternalServerErrorException('Failed to remove knowledge base item')
    }
  }

  // ─── FAQ Manager Methods ─────────────────────────────────────────────────

  async fetchFaqManagerList(userId: string) {
    try {
      if (!userId) throw new BadRequestException('User ID is required')
      return await this.faqRepository.getFaqManagerMany(userId)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get FAQ list', error)
      throw new InternalServerErrorException('Failed to get FAQ list')
    }
  }

  async storeFaqManager(userId: string, dto: CreateFaqManagerDto) {
    try {
      if (!userId) throw new BadRequestException('User ID is required')
      if (!dto.question || !dto.answer) throw new BadRequestException('Question and answer are required')
      return await this.faqRepository.postFaqManager(userId, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to create FAQ', error)
      throw new InternalServerErrorException('Failed to create FAQ')
    }
  }

  async removeFaqManager(id: string, userId: string) {
    try {
      if (!id) throw new BadRequestException('FAQ ID is required')
      if (!userId) throw new BadRequestException('User ID is required')
      const faq = await this.faqRepository.getFaqManagerById(id, userId)
      if (!faq) throw new BadRequestException('FAQ not found')
      await this.faqRepository.deleteFaqManager(id, userId)
      return { success: true }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to delete FAQ', error)
      throw new InternalServerErrorException('Failed to delete FAQ')
    }
  }
}
