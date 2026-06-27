import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Response } from 'express'
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard'
import { ChatService } from '../services/chat.service'
import { ChatDto } from '../dto/chat.dto'

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Stream agent chat response via SSE' })
  async chat(@Body() dto: ChatDto, @Res() res: Response): Promise<void> {
    await this.chatService.streamChat(dto, res)
  }
}
