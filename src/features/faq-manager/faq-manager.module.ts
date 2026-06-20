import { Module } from '@nestjs/common'
import { SharedModule } from '../../shared/shared.module'
import { QueueModule } from '../../shared/queues/queue.module'
import { FaqManagerController } from './controllers/faqManager.controller'
import { FaqManagerService } from './services/faqManager.service'
import { FaqManagerRepository } from './repositories/faqManager.repository'

@Module({
  imports: [SharedModule, QueueModule],
  controllers: [FaqManagerController],
  providers: [FaqManagerService, FaqManagerRepository],
})
export class FaqManagerModule {}
