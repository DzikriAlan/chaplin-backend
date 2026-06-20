import { Module } from '@nestjs/common'
import { SharedModule } from '../../shared/shared.module'
import { QueueModule } from '../../shared/queues/queue.module'
import { KnowledgeBaseController } from './controllers/knowledgeBase.controller'
import { KnowledgeBaseService } from './services/knowledgeBase.service'
import { KnowledgeBaseRepository } from './repositories/knowledgeBase.repository'

@Module({
  imports: [SharedModule, QueueModule],
  controllers: [KnowledgeBaseController],
  providers: [KnowledgeBaseService, KnowledgeBaseRepository],
})
export class KnowledgeBaseModule {}
