import { HttpException, Injectable, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common'
import { AgentsRepository } from '../repositories/agents.repository'
import { CacheService } from '../../../shared/services/cache.service'
import type { CreateAgentsDto, UpdateAgentsDto } from '../dto/agents.dto'

const AGENTS_LIST_KEY = 'agents:list'

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name)

  constructor(
    private readonly agentsRepository: AgentsRepository,
    private readonly cacheService: CacheService,
  ) {}

  async getAgentsList() {
    try {
      return await this.cacheService.getOrSet(
        AGENTS_LIST_KEY,
        () => this.agentsRepository.findAgentsMany(),
        this.cacheService.ttl.AGENTS,
      )
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get agents list', error)
      throw new InternalServerErrorException('Failed to get agents list')
    }
  }

  async storeAgents(dto: CreateAgentsDto) {
    try {
      if (!dto.name?.trim()) throw new BadRequestException('Missing name')
      if (dto.isDefault) {
        await this.agentsRepository.updateAgentsDefault()
      }
      const result = await this.agentsRepository.createAgents(dto)
      await this.cacheService.invalidate(AGENTS_LIST_KEY)
      return result
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to store agent', error)
      throw new InternalServerErrorException('Failed to create agent')
    }
  }

  async changeAgents(id: string, dto: UpdateAgentsDto) {
    try {
      if (dto.isDefault) {
        await this.agentsRepository.updateAgentsDefault(id)
      }
      const result = await this.agentsRepository.updateAgents(id, dto)
      await this.cacheService.invalidate(AGENTS_LIST_KEY)
      return result
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to change agent', error)
      throw new InternalServerErrorException('Failed to update agent')
    }
  }

  async removeAgents(id: string) {
    try {
      await this.agentsRepository.deleteAgents(id)
      await this.cacheService.invalidate(AGENTS_LIST_KEY)
      return { success: true }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to remove agent', error)
      throw new InternalServerErrorException('Failed to remove agent')
    }
  }
}
