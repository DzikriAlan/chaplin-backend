import { Module } from '@nestjs/common'
import { SharedModule } from '../../shared/shared.module'
import { DriveController } from './controllers/drive.controller'
import { DriveService } from './services/drive.service'
import { DriveRepository } from './repositories/drive.repository'

@Module({
  imports: [SharedModule],
  controllers: [DriveController],
  providers: [DriveService, DriveRepository],
})
export class DriveModule {}
