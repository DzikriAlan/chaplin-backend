import { Module } from '@nestjs/common'
import { SharedModule } from '../../shared/shared.module'
import { QueueModule } from '../../shared/queues/queue.module'

// Controllers
import { KnowledgeBaseFaqController } from './controllers/knowledgeBaseFaq.controller'
import { KnowledgeBaseGoogleDriveController } from './controllers/knowledgeBaseGoogleDrive.controller'
import { KnowledgeBaseMyDriveController } from './controllers/knowledgeBaseMyDrive.controller'

// Services
import { KnowledgeBaseFaqService } from './services/knowledgeBaseFaq.service'
import { KnowledgeBaseGoogleDriveService } from './services/knowledgeBaseGoogleDrive.service'
import { KnowledgeBaseMyDriveService } from './services/knowledgeBaseMyDrive.service'

// Repositories
import { KnowledgeBaseFaqRepository } from './repositories/knowledgeBaseFaq.repository'
import { KnowledgeBaseGoogleDriveRepository } from './repositories/knowledgeBaseGoogleDrive.repository'
import { KnowledgeBaseMyDriveRepository } from './repositories/knowledgeBaseMyDrive.repository'

@Module({
  imports: [SharedModule, QueueModule],
  controllers: [
    KnowledgeBaseFaqController,
    KnowledgeBaseGoogleDriveController,
    KnowledgeBaseMyDriveController,
  ],
  providers: [
    // FAQ & Public Knowledge Base
    KnowledgeBaseFaqService,
    KnowledgeBaseFaqRepository,
    // Google Drive
    KnowledgeBaseGoogleDriveService,
    KnowledgeBaseGoogleDriveRepository,
    // My Drive
    KnowledgeBaseMyDriveService,
    KnowledgeBaseMyDriveRepository,
  ],
})
export class KnowledgeBaseModule {}
