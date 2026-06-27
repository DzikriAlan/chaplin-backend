import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { PaginatedResult } from '../../../shared/utils/paginated-result'
import { UsageSaldoRepository } from '../repositories/usageSaldo.repository'
import type { CreateUsageSaldoTopupDto, QueryUsageSaldoLogsDto } from '../dto/usageSaldo.dto'

const MINIMUM_TOPUP = 20000

@Injectable()
export class UsageSaldoService {
  private readonly logger = new Logger(UsageSaldoService.name)

  constructor(private readonly usageSaldoRepository: UsageSaldoRepository) {}

  // ─── Balance Methods ─────────────────────────────────────────────────────────

  async fetchBalance(userId: string) {
    try {
      const record = await this.usageSaldoRepository.getBalance(userId)
      if (record) return record
      return this.usageSaldoRepository.postBalance(userId)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to fetch balance', error)
      throw new InternalServerErrorException('Failed to fetch balance')
    }
  }

  async storeTopup(userId: string, dto: CreateUsageSaldoTopupDto) {
    try {
      if (dto.amount < MINIMUM_TOPUP) {
        throw new BadRequestException(`Top-up minimal Rp ${MINIMUM_TOPUP.toLocaleString('id-ID')}`)
      }
      const record = await this.fetchBalance(userId)
      return this.usageSaldoRepository.updateBalance(userId, record.balance, dto.amount)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to store balance', error)
      throw new InternalServerErrorException('Failed to top up balance')
    }
  }

  // ─── Usage Methods ───────────────────────────────────────────────────────────

  async fetchUsageLogs(userId: string, query: QueryUsageSaldoLogsDto) {
    try {
      const limit = Math.min(Number.parseInt(query.limit ?? '100', 10), 500)
      const offset = Math.max(Number.parseInt(query.offset ?? '0', 10), 0)
      const month = query.month ? Number.parseInt(query.month, 10) : null
      const year = query.year ? Number.parseInt(query.year, 10) : null
      const result = await this.usageSaldoRepository.getUsageLogs({ userId, limit, offset, month, year })
      return new PaginatedResult(result.logs, result.total, limit, offset)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get usage list', error)
      throw new InternalServerErrorException('Failed to get usage list')
    }
  }
}
