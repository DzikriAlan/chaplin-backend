import { HttpException, Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common'
import { KnowledgeBaseRepository } from '../repositories/knowledgeBase.repository'
import { QueueService } from '../../../shared/queues/queue.service'
import type { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from '../dto/knowledgeBase.dto'

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name)

  constructor(
    private readonly knowledgeBaseRepository: KnowledgeBaseRepository,
    private readonly queueService: QueueService,
  ) {}

  async getKnowledgeBaseList() {
    try {
      return await this.knowledgeBaseRepository.findKnowledgeBaseMany()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get knowledge base list', error)
      throw new InternalServerErrorException('Failed to get knowledge base list')
    }
  }

  async storeKnowledgeBase(dto: CreateKnowledgeBaseDto) {
    try {
      if (!dto.question || !dto.answer) throw new BadRequestException('Missing question or answer')
      const item = await this.knowledgeBaseRepository.createKnowledgeBase(dto)
      await this.queueService.enqueueKbEmbed(item.id, dto.question, dto.answer)
      await this.knowledgeBaseRepository.deleteChatCache()
      return item
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to store knowledge base', error)
      throw new InternalServerErrorException('Failed to create knowledge base item')
    }
  }

  async changeKnowledgeBase(id: string, dto: UpdateKnowledgeBaseDto) {
    try {
      const item = await this.knowledgeBaseRepository.updateKnowledgeBase(id, dto)
      if (dto.question !== undefined || dto.answer !== undefined) {
        await this.queueService.enqueueKbEmbed(id, item.question, item.answer)
      }
      await this.knowledgeBaseRepository.deleteChatCache()
      return item
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to change knowledge base', error)
      throw new InternalServerErrorException('Failed to update knowledge base item')
    }
  }

  async removeKnowledgeBase(id: string) {
    try {
      await this.knowledgeBaseRepository.updateKnowledgeBaseActive(id, false)
      await this.knowledgeBaseRepository.deleteChatCache()
      return { success: true }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to remove knowledge base', error)
      throw new InternalServerErrorException('Failed to remove knowledge base item')
    }
  }
}
