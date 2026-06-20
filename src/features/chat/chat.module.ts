import { Module } from '@nestjs/common'
import { SharedModule } from '../../shared/shared.module'
import { ChatController } from './controllers/chat.controller'
import { ChatService } from './services/chat.service'
import { ChatRepository } from './repositories/chat.repository'

@Module({
  imports: [SharedModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
})
export class ChatModule {}
