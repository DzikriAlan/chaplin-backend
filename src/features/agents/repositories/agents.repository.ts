import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'
import type { CreateAgentsDto, UpdateAgentsDto } from '../dto/agents.dto'

@Injectable()
export class AgentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAgentsMany() {
    try {
      return await this.prisma.agent.findMany({ orderBy: { createdAt: 'desc' } })
    } catch (error) {
      throw handlePrismaError(error, 'agent')
    }
  }

  async postAgents(dto: CreateAgentsDto) {
    try {
      return await this.prisma.agent.create({
        data: {
          name: dto.name,
          description: dto.description ?? null,
          image: dto.image ?? null,
          personalization: dto.personalization ?? null,
          knowledgeBaseIds: dto.knowledgeBaseIds ?? [],
          isDefault: dto.isDefault ?? false,
        },
      })
    } catch (error) {
      throw handlePrismaError(error, 'agent')
    }
  }

  async updateAgentsDefault(excludeId?: string) {
    try {
      return await this.prisma.agent.updateMany({
        where: { isDefault: true, ...(excludeId ? { id: { not: excludeId } } : {}) },
        data: { isDefault: false },
      })
    } catch (error) {
      throw handlePrismaError(error, 'agent')
    }
  }

  async patchAgents(id: string, dto: UpdateAgentsDto) {
    try {
      return await this.prisma.agent.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.image !== undefined && { image: dto.image }),
          ...(dto.personalization !== undefined && { personalization: dto.personalization }),
          ...(dto.knowledgeBaseIds !== undefined && { knowledgeBaseIds: dto.knowledgeBaseIds }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        },
      })
    } catch (error) {
      throw handlePrismaError(error, 'agent')
    }
  }

  async deleteAgents(id: string) {
    try {
      return await this.prisma.agent.delete({ where: { id } })
    } catch (error) {
      throw handlePrismaError(error, 'agent')
    }
  }
}
