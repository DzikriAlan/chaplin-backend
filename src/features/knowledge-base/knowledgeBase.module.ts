import { Module } from '@nestjs/common'
import { SharedModule } from '../../shared/shared.module'
import { QueueModule } from '../../shared/queues/queue.module'
// Original knowledge-base
import { KnowledgeBaseController } from './controllers/knowledgeBase.controller'
import { KnowledgeBaseService } from './services/knowledgeBase.service'
import { KnowledgeBaseRepository } from './repositories/knowledgeBase.repository'
// Sub-controllers
import { KnowledgeBaseFaqController } from './controllers/knowledgeBaseFaq.controller'
import { KnowledgeBaseGoogleDriveController } from './controllers/knowledgeBaseGoogleDrive.controller'
import { KnowledgeBaseMyDriveController } from './controllers/knowledgeBaseMyDrive.controller'
// FAQ Manager (for /knowledge-base/faq)
import { FaqManagerService } from '../faq-manager/services/faqManager.service'
import { FaqManagerRepository } from '../faq-manager/repositories/faqManager.repository'
// Drive (for /knowledge-base/google-drive)
import { DriveService } from '../drive/services/drive.service'
import { DriveRepository } from '../drive/repositories/drive.repository'
// Documents (for /knowledge-base/google-drive)
import { DocumentsService } from '../documents/services/documents.service'
import { DocumentsRepository } from '../documents/repositories/documents.repository'
// Upload (for /knowledge-base/my-drive)
import { UploadService } from '../upload/services/upload.service'
import { UploadRepository } from '../upload/repositories/upload.repository'

@Module({
  imports: [SharedModule, QueueModule],
  controllers: [
    KnowledgeBaseController,
    KnowledgeBaseFaqController,
    KnowledgeBaseGoogleDriveController,
    KnowledgeBaseMyDriveController,
  ],
  providers: [
    // Original
    KnowledgeBaseService,
    KnowledgeBaseRepository,
    // FAQ Manager
    FaqManagerService,
    FaqManagerRepository,
    // Drive + Documents
    DriveService,
    DriveRepository,
    DocumentsService,
    DocumentsRepository,
    // Upload
    UploadService,
    UploadRepository,
  ],
})
export class KnowledgeBaseModule {}
