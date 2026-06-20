import { Module } from '@nestjs/common'
import { SharedModule } from '../../shared/shared.module'
import { AiChatController } from './controllers/aiChat.controller'
import { AiChatService } from './services/aiChat.service'
import { AiChatRepository } from './repositories/aiChat.repository'

@Module({
  imports: [SharedModule],
  controllers: [AiChatController],
  providers: [AiChatService, AiChatRepository],
})
export class AiChatModule {}
