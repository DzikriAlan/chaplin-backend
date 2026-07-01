import { HttpException, Injectable, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common'
import { AgentsRepository } from '../repositories/agents.repository'
import { CacheService } from '../../../shared/services/cache.service'
import { AiService } from '../../../shared/services/ai.service'
import type { CreateAgentsDto, UpdateAgentsDto } from '../dto/agents.dto'

const AGENTS_LIST_KEY = 'agents:list'

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name)

  constructor(
    private readonly agentsRepository: AgentsRepository,
    private readonly cacheService: CacheService,
    private readonly aiService: AiService,
  ) {}

  async generateAgent(prompt: string): Promise<{ name: string; description: string; personalization: string }> {
    try {
      const response = await this.aiService.deepseek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `Kamu adalah desainer AI agent. Berdasarkan permintaan pengguna, buat profil AI agent.
Kembalikan HANYA objek JSON dengan field berikut (tidak ada teks lain):
- name: nama agent singkat (2-4 kata, bahasa Indonesia)
- description: deskripsi singkat (maks 80 karakter)
- personalization: system prompt detail untuk AI agent (bahasa Indonesia, spesifik, instruktif)

Contoh output:
{"name":"Agen Sepak Bola","description":"Ahli sepak bola, statistik, dan berita terkini","personalization":"Kamu adalah asisten AI yang ahli dalam dunia sepak bola. Jawab pertanyaan tentang aturan, statistik pemain, sejarah pertandingan, dan berita terkini dengan akurat dan antusias."}`,
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0]?.message?.content ?? '{}'
      const parsed = JSON.parse(content) as { name?: string; description?: string; personalization?: string }
      return {
        name: parsed.name ?? '',
        description: parsed.description ?? '',
        personalization: parsed.personalization ?? '',
      }
    } catch (error) {
      this.logger.error('Failed to generate agent', error)
      throw new InternalServerErrorException('Gagal generate agent, coba lagi')
    }
  }

  async fetchAgentsList() {
    try {
      return await this.cacheService.getOrSet(
        AGENTS_LIST_KEY,
        () => this.agentsRepository.getAgentsMany(),
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
      const result = await this.agentsRepository.postAgents(dto)
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
      const result = await this.agentsRepository.patchAgents(id, dto)
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
