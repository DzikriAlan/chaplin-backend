import { Module } from '@nestjs/common'
import { SharedModule } from '../../shared/shared.module'
import { DocumentsController } from './controllers/documents.controller'
import { DocumentsService } from './services/documents.service'
import { DocumentsRepository } from './repositories/documents.repository'

@Module({
  imports: [SharedModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsRepository],
})
export class DocumentsModule {}
