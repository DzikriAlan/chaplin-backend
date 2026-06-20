import { Module } from '@nestjs/common'
import { SharedModule } from '../../shared/shared.module'
import { DashboardController } from './controllers/dashboard.controller'
import { DashboardService } from './services/dashboard.service'
import { DashboardRepository } from './repositories/dashboard.repository'

@Module({
  imports: [SharedModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository],
})
export class DashboardModule {}
