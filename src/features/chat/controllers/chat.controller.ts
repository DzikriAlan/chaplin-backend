import { Body, Controller, Delete, Get, Param, Post, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Response } from 'express'
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard'
import { CurrentUser } from '../../../shared/decorators/current-user.decorator'
import type { CurrentUserPayload } from '../../../shared/decorators/current-user.decorator'
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

  @Get('conversations')
  @ApiOperation({ summary: 'Get conversation list for current user' })
  async getConversations(@CurrentUser() user: CurrentUserPayload) {
    return await this.chatService.getUserConversations(user.id)
  }

  @Get('conversations/:sessionId')
  @ApiOperation({ summary: 'Get conversation history' })
  async getConversation(@Param('sessionId') sessionId: string) {
    return await this.chatService.getConversationHistory(sessionId)
  }

  @Post('conversations/:sessionId/rename')
  @ApiOperation({ summary: 'Rename conversation' })
  async renameConversation(@Param('sessionId') sessionId: string, @Body() body: { title: string }) {
    const success = await this.chatService.updateConversationTitle(sessionId, body.title)
    return { success }
  }

  @Delete('conversations/:sessionId')
  @ApiOperation({ summary: 'Delete conversation' })
  async deleteConversation(@Param('sessionId') sessionId: string) {
    const success = await this.chatService.deleteConversation(sessionId)
    return { success }
  }
}
