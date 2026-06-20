import { Module } from '@nestjs/common'
import { SharedModule } from '../../shared/shared.module'
import { UploadController } from './controllers/upload.controller'
import { UploadService } from './services/upload.service'
import { UploadRepository } from './repositories/upload.repository'

@Module({
  imports: [SharedModule],
  controllers: [UploadController],
  providers: [UploadService, UploadRepository],
})
export class UploadModule {}
