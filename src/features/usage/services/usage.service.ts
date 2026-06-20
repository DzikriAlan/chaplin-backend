import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { PaginatedResult } from '../../../shared/utils/paginated-result'
import { UsageRepository } from '../repositories/usage.repository'
import type { QueryUsageDto } from '../dto/usage.dto'

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name)

  constructor(private readonly usageRepository: UsageRepository) {}

  async getUsageList(userId: string, query: QueryUsageDto) {
    try {
      const limit = Math.min(Number.parseInt(query.limit ?? '100', 10), 500)
      const offset = Math.max(Number.parseInt(query.offset ?? '0', 10), 0)
      const month = query.month ? Number.parseInt(query.month, 10) : null
      const year = query.year ? Number.parseInt(query.year, 10) : null
      const result = await this.usageRepository.findUsageLogs({ userId, limit, offset, month, year })
      return new PaginatedResult(result.logs, result.total, limit, offset)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get usage list', error)
      throw new InternalServerErrorException('Failed to get usage list')
    }
  }
}
