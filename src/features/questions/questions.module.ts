import { Module } from '@nestjs/common'
import { SharedModule } from '../../shared/shared.module'
import { QuestionsController } from './controllers/questions.controller'
import { QuestionsService } from './services/questions.service'
import { QuestionsRepository } from './repositories/questions.repository'

@Module({
  imports: [SharedModule],
  controllers: [QuestionsController],
  providers: [QuestionsService, QuestionsRepository],
})
export class QuestionsModule {}
