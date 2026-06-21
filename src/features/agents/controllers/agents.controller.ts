import { Body, Controller, Delete, Get, HttpException, InternalServerErrorException, Logger, Patch, Post, Query } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { AgentsService } from '../services/agents.service'
import type { CreateAgentsDto, UpdateAgentsDto } from '../dto/agents.dto'

@ApiTags('agent')
@Controller('agent')
export class AgentsController {
  private readonly logger = new Logger(AgentsController.name)

  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  @ApiOperation({ summary: 'Get agents list' })
  async fetchAgentsList() {
    try {
      return await this.agentsService.getAgentsList()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchAgentsList', error)
      throw new InternalServerErrorException()
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create agent' })
  async saveAgents(@Body() dto: CreateAgentsDto) {
    try {
      return await this.agentsService.storeAgents(dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveAgents', error)
      throw new InternalServerErrorException()
    }
  }

  @Patch()
  @ApiOperation({ summary: 'Update agent' })
  async modifyAgents(@Query('id') id: string, @Body() dto: UpdateAgentsDto) {
    try {
      return await this.agentsService.changeAgents(id, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in modifyAgents', error)
      throw new InternalServerErrorException()
    }
  }

  @Delete()
  @ApiOperation({ summary: 'Delete agent' })
  async destroyAgents(@Query('id') id: string) {
    try {
      return await this.agentsService.removeAgents(id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in destroyAgents', error)
      throw new InternalServerErrorException()
    }
  }
}
