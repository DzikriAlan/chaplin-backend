import { Body, Controller, Post, Res } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Response } from 'express'
import { ChatService } from '../services/chat.service'
import { ChatDto } from '../dto/chat.dto'

@ApiTags('embed')
@Controller('embed/chat')
export class EmbedChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Public embed chat — no auth required' })
  async embedChat(@Body() dto: ChatDto, @Res() res: Response): Promise<void> {
    await this.chatService.streamChat({ ...dto, userId: null }, res)
  }
}
