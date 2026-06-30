import { Body, Controller, Delete, Get, HttpException, InternalServerErrorException, Logger, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard'
import { CurrentUser, type CurrentUserPayload } from '../../../shared/decorators/current-user.decorator'
import { KnowledgeBaseFaqService } from '../services/knowledgeBaseFaq.service'
import { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto, CreateFaqManagerDto } from '../dto/knowledgeBaseFaq.dto'

@ApiTags('knowledge-base/faq')
@Controller('knowledge-base/faq')
export class KnowledgeBaseFaqController {
  private readonly logger = new Logger(KnowledgeBaseFaqController.name)

  constructor(private readonly faqService: KnowledgeBaseFaqService) {}

  // ─── Knowledge Base Items (Public) ───────────────────────────────────────────

  @Get('items')
  @ApiOperation({ summary: 'Get knowledge base list (public)' })
  async loadKnowledgeBaseList() {
    try {
      return await this.faqService.fetchKnowledgeBaseList()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in loadKnowledgeBaseList', error)
      throw new InternalServerErrorException()
    }
  }

  @Post('items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create knowledge base item' })
  async saveKnowledgeBase(@Body() dto: CreateKnowledgeBaseDto) {
    try {
      return await this.faqService.storeKnowledgeBase(dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveKnowledgeBase', error)
      throw new InternalServerErrorException()
    }
  }

  @Patch('items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update knowledge base item' })
  async modifyKnowledgeBase(@Query('id') id: string, @Body() dto: UpdateKnowledgeBaseDto) {
    try {
      return await this.faqService.changeKnowledgeBase(id, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in modifyKnowledgeBase', error)
      throw new InternalServerErrorException()
    }
  }

  @Delete('items')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete knowledge base item' })
  async destroyKnowledgeBase(@Query('id') id: string) {
    try {
      return await this.faqService.removeKnowledgeBase(id)
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
  async loadFaqList(@CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.faqService.fetchFaqManagerList(user.id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in loadFaqList', error)
      throw new InternalServerErrorException()
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create FAQ item for current user' })
  async saveFaq(@Body() dto: CreateFaqManagerDto, @CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.faqService.storeFaqManager(user.id, dto)
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
      return await this.faqService.removeFaqManager(id, user.id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in destroyFaq', error)
      throw new InternalServerErrorException()
    }
  }
}
