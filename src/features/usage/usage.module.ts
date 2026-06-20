import { Module } from '@nestjs/common'
import { SharedModule } from '../../shared/shared.module'
import { UsageController } from './controllers/usage.controller'
import { UsageService } from './services/usage.service'
import { UsageRepository } from './repositories/usage.repository'

@Module({
  imports: [SharedModule],
  controllers: [UsageController],
  providers: [UsageService, UsageRepository],
})
export class UsageModule {}
