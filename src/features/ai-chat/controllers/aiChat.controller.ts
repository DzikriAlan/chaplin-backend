import { Body, Controller, HttpException, InternalServerErrorException, Logger, Post, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import type { Response } from 'express'
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard'
import { CurrentUser, type CurrentUserPayload } from '../../../shared/decorators/current-user.decorator'
import { AiChatService } from '../services/aiChat.service'
import type { SaveAiChatDto } from '../dto/aiChat.dto'

@ApiTags('ai-chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-chat')
export class AiChatController {
  private readonly logger = new Logger(AiChatController.name)

  constructor(private readonly aiChatService: AiChatService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'AI chat stream for external chatbot (SSE, JWT)' })
  async saveAiChat(@Body() dto: SaveAiChatDto, @CurrentUser() user: CurrentUserPayload, @Res() res: Response) {
    try {
      return await this.aiChatService.storeAiChatStream(dto, user.id, res)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveAiChat', error)
      if (!res.headersSent) throw new InternalServerErrorException()
    }
  }
}
