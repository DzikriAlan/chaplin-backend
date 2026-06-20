import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common'
import { FaqManagerRepository } from '../repositories/faqManager.repository'
import { QueueService } from '../../../shared/queues/queue.service'
import type { CreateFaqManagerDto } from '../dto/faqManager.dto'

const MAX_FAQ = 50

@Injectable()
export class FaqManagerService {
  private readonly logger = new Logger(FaqManagerService.name)

  constructor(
    private readonly faqManagerRepository: FaqManagerRepository,
    private readonly queueService: QueueService,
  ) {}

  async getFaqManagerList(userId: string) {
    try {
      return await this.faqManagerRepository.findFaqManagerByUser(userId)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get FAQ manager list', error)
      throw new InternalServerErrorException('Failed to get FAQ list')
    }
  }

  async storeFaqManager(userId: string, dto: CreateFaqManagerDto) {
    try {
      const count = await this.faqManagerRepository.countFaqManagerByUser(userId)
      if (count >= MAX_FAQ) throw new BadRequestException(`Maksimal ${MAX_FAQ} FAQ per akun`)

      const item = await this.faqManagerRepository.createFaqManager(userId, dto)

      await this.queueService.enqueueFaqEmbed(item.id, dto.question, dto.answer)

      return item
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to store FAQ manager', error)
      throw new InternalServerErrorException('Failed to create FAQ item')
    }
  }

  async removeFaqManager(id: string, userId: string) {
    try {
      const item = await this.faqManagerRepository.findFaqManagerById(id, userId)
      if (!item) throw new NotFoundException('FAQ tidak ditemukan')
      await this.faqManagerRepository.deleteFaqManager(id)
      return { success: true }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to remove FAQ manager', error)
      throw new InternalServerErrorException('Failed to remove FAQ item')
    }
  }
}
