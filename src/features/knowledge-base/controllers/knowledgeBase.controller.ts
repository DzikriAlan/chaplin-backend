import { Body, Controller, Delete, Get, HttpException, InternalServerErrorException, Logger, Patch, Post, Query } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { KnowledgeBaseService } from '../services/knowledgeBase.service'
import type { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from '../dto/knowledgeBase.dto'

@ApiTags('knowledge-base')
@Controller('knowledge-base')
export class KnowledgeBaseController {
  private readonly logger = new Logger(KnowledgeBaseController.name)

  constructor(private readonly knowledgeBaseService: KnowledgeBaseService) {}

  @Get()
  @ApiOperation({ summary: 'Get knowledge base list' })
  async fetchKnowledgeBaseList() {
    try {
      return await this.knowledgeBaseService.getKnowledgeBaseList()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchKnowledgeBaseList', error)
      throw new InternalServerErrorException()
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create knowledge base item' })
  async saveKnowledgeBase(@Body() dto: CreateKnowledgeBaseDto) {
    try {
      return await this.knowledgeBaseService.storeKnowledgeBase(dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveKnowledgeBase', error)
      throw new InternalServerErrorException()
    }
  }

  @Patch()
  @ApiOperation({ summary: 'Update knowledge base item' })
  async modifyKnowledgeBase(@Query('id') id: string, @Body() dto: UpdateKnowledgeBaseDto) {
    try {
      return await this.knowledgeBaseService.changeKnowledgeBase(id, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in modifyKnowledgeBase', error)
      throw new InternalServerErrorException()
    }
  }

  @Delete()
  @ApiOperation({ summary: 'Delete knowledge base item' })
  async destroyKnowledgeBase(@Query('id') id: string) {
    try {
      return await this.knowledgeBaseService.removeKnowledgeBase(id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in destroyKnowledgeBase', error)
      throw new InternalServerErrorException()
    }
  }
}
