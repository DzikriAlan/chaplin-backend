import { Body, Controller, Delete, Get, HttpException, InternalServerErrorException, Logger, Patch, Post, Query, Res } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { Response } from 'express'
import { ChatService } from '../services/chat.service'
import { SaveChatDto, PatchChatSessionsDto } from '../dto/chat.dto'

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name)

  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'Get chat history by sessionId' })
  async fetchChat(@Query('sessionId') sessionId: string) {
    try {
      return await this.chatService.getChat(sessionId)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchChat', error)
      throw new InternalServerErrorException()
    }
  }

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Post chat message (SSE stream)' })
  async saveChat(@Body() dto: SaveChatDto, @Res() res: Response) {
    try {
      return await this.chatService.storeChatStream(dto, res)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveChat', error)
      if (!res.headersSent) throw new InternalServerErrorException()
    }
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get chat sessions list' })
  async fetchChatSessions() {
    try {
      return await this.chatService.getChatSessions()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchChatSessions', error)
      throw new InternalServerErrorException()
    }
  }

  @Patch('sessions')
  @ApiOperation({ summary: 'Patch chat session title' })
  async modifyChatSessions(@Body() dto: PatchChatSessionsDto) {
    try {
      return await this.chatService.changeChatSession(dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in modifyChatSessions', error)
      throw new InternalServerErrorException()
    }
  }

  @Delete('sessions')
  @ApiOperation({ summary: 'Delete chat session' })
  async destroyChatSessions(@Query('sessionId') sessionId: string) {
    try {
      return await this.chatService.removeChatSession(sessionId)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in destroyChatSessions', error)
      throw new InternalServerErrorException()
    }
  }
}
