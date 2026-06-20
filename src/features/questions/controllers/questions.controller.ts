import { Body, Controller, Get, HttpException, InternalServerErrorException, Logger, Post, Query } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { QuestionsService } from '../services/questions.service'
import type { CreateQuestionsGenerateDto, QueryQuestionsDto } from '../dto/questions.dto'

@ApiTags('questions')
@Controller('questions')
export class QuestionsController {
  private readonly logger = new Logger(QuestionsController.name)

  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get questions list' })
  async fetchQuestionsList(@Query() query: QueryQuestionsDto) {
    try {
      return await this.questionsService.getQuestionsList(query)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchQuestionsList', error)
      throw new InternalServerErrorException()
    }
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate questions from documents' })
  async saveQuestionsGenerate(@Body() dto: CreateQuestionsGenerateDto) {
    try {
      return await this.questionsService.storeQuestionsGenerate(dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveQuestionsGenerate', error)
      throw new InternalServerErrorException()
    }
  }
}
