import { Body, Controller, Delete, Get, HttpException, InternalServerErrorException, Logger, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard'
import { CurrentUser, type CurrentUserPayload } from '../../../shared/decorators/current-user.decorator'
import { KnowledgeBaseService } from '../services/knowledgeBase.service'
import { FaqManagerService } from '../../faq-manager/services/faqManager.service'
import type { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from '../dto/knowledgeBase.dto'
import type { CreateFaqManagerDto } from '../../faq-manager/dto/faqManager.dto'

@ApiTags('knowledge-base/faq')
@Controller('knowledge-base/faq')
export class KnowledgeBaseFaqController {
  private readonly logger = new Logger(KnowledgeBaseFaqController.name)

  constructor(
    private readonly knowledgeBaseService: KnowledgeBaseService,
    private readonly faqManagerService: FaqManagerService,
  ) {}

  // ─── Knowledge Base Items (Public) ───────────────────────────────────────────

  @Get('items')
  @ApiOperation({ summary: 'Get knowledge base list (public)' })
  async fetchKnowledgeBaseList() {
    try {
      return await this.knowledgeBaseService.getKnowledgeBaseList()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchKnowledgeBaseList', error)
      throw new InternalServerErrorException()
    }
  }

  @Post('items')
  @ApiOperation({ summary: 'Create knowledge base item (public)' })
  async saveKnowledgeBase(@Body() dto: CreateKnowledgeBaseDto) {
    try {
      return await this.knowledgeBaseService.storeKnowledgeBase(dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveKnowledgeBase', error)
      throw new InternalServerErrorException()
    }
  }

  @Patch('items')
  @ApiOperation({ summary: 'Update knowledge base item (public)' })
  async modifyKnowledgeBase(@Query('id') id: string, @Body() dto: UpdateKnowledgeBaseDto) {
    try {
      return await this.knowledgeBaseService.changeKnowledgeBase(id, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in modifyKnowledgeBase', error)
      throw new InternalServerErrorException()
    }
  }

  @Delete('items')
  @ApiOperation({ summary: 'Delete knowledge base item (public)' })
  async destroyKnowledgeBase(@Query('id') id: string) {
    try {
      return await this.knowledgeBaseService.removeKnowledgeBase(id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in destroyKnowledgeBase', error)
      throw new InternalServerErrorException()
    }
  }

  // ─── FAQ Manager (User-specific, requires auth) ──────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get FAQ list for current user' })
  async fetchFaqList(@CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.faqManagerService.getFaqManagerList(user.id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchFaqList', error)
      throw new InternalServerErrorException()
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create FAQ item for current user' })
  async saveFaq(@Body() dto: CreateFaqManagerDto, @CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.faqManagerService.storeFaqManager(user.id, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveFaq', error)
      throw new InternalServerErrorException()
    }
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete FAQ item for current user' })
  async destroyFaq(@Query('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.faqManagerService.removeFaqManager(id, user.id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in destroyFaq', error)
      throw new InternalServerErrorException()
    }
  }
}
