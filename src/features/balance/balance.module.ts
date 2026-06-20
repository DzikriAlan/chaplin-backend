import { Module } from '@nestjs/common'
import { SharedModule } from '../../shared/shared.module'
import { BalanceController } from './controllers/balance.controller'
import { BalanceService } from './services/balance.service'
import { BalanceRepository } from './repositories/balance.repository'

@Module({
  imports: [SharedModule],
  controllers: [BalanceController],
  providers: [BalanceService, BalanceRepository],
})
export class BalanceModule {}
