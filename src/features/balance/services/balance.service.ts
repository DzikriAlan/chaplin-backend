import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { BalanceRepository } from '../repositories/balance.repository'
import type { CreateBalanceDto } from '../dto/balance.dto'

const MINIMUM_TOPUP = 20000

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name)

  constructor(private readonly balanceRepository: BalanceRepository) {}

  async getBalance(userId: string) {
    try {
      const record = await this.balanceRepository.findBalance(userId)
      if (record) return record
      return this.balanceRepository.createBalance(userId)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get balance', error)
      throw new InternalServerErrorException('Failed to get balance')
    }
  }

  async storeBalance(userId: string, dto: CreateBalanceDto) {
    try {
      if (dto.amount < MINIMUM_TOPUP) {
        throw new BadRequestException(`Top-up minimal Rp ${MINIMUM_TOPUP.toLocaleString('id-ID')}`)
      }
      const record = await this.getBalance(userId)
      return this.balanceRepository.updateBalanceTopup(userId, record.balance, dto.amount)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to store balance', error)
      throw new InternalServerErrorException('Failed to top up balance')
    }
  }
}
