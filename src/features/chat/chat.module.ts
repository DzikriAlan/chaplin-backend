import { Module } from '@nestjs/common'
import { SharedModule } from '../../shared/shared.module'
import { ChatController } from './controllers/chat.controller'
import { EmbedChatController } from './controllers/embed-chat.controller'
import { ChatService } from './services/chat.service'

@Module({
  imports: [SharedModule],
  controllers: [ChatController, EmbedChatController],
  providers: [ChatService],
})
export class ChatModule {}
