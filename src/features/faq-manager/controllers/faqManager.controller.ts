import { Body, Controller, Delete, Get, HttpException, InternalServerErrorException, Logger, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard'
import { CurrentUser, type CurrentUserPayload } from '../../../shared/decorators/current-user.decorator'
import { FaqManagerService } from '../services/faqManager.service'
import type { CreateFaqManagerDto } from '../dto/faqManager.dto'

@ApiTags('faq-manager')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('faq-manager')
export class FaqManagerController {
  private readonly logger = new Logger(FaqManagerController.name)

  constructor(private readonly faqManagerService: FaqManagerService) {}

  @Get()
  @ApiOperation({ summary: 'Get FAQ list' })
  async fetchFaqManagerList(@CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.faqManagerService.getFaqManagerList(user.id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchFaqManagerList', error)
      throw new InternalServerErrorException()
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create FAQ item' })
  async saveFaqManager(@Body() dto: CreateFaqManagerDto, @CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.faqManagerService.storeFaqManager(user.id, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveFaqManager', error)
      throw new InternalServerErrorException()
    }
  }

  @Delete()
  @ApiOperation({ summary: 'Delete FAQ item' })
  async destroyFaqManager(@Query('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.faqManagerService.removeFaqManager(id, user.id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in destroyFaqManager', error)
      throw new InternalServerErrorException()
    }
  }
}
