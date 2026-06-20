import { Injectable, Logger } from '@nestjs/common'
import { RedisService } from './redis.service'

const DEFAULT_TTL = {
  AGENTS: 300,          // 5 min
  KNOWLEDGE_BASE: 600,  // 10 min
  QUESTIONS: 1800,      // 30 min
  DASHBOARD: 60,        // 1 min
  DOCUMENTS: 60,        // 1 min
  UPLOAD: 300,          // 5 min
} as const

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name)

  constructor(private readonly redisService: RedisService) {}

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl: number): Promise<T> {
    const cached = await this.redisService.get<T>(key)
    if (cached !== null) {
      this.logger.debug(`Cache HIT: ${key}`)
      return cached
    }
    this.logger.debug(`Cache MISS: ${key}`)
    const data = await factory()
    await this.redisService.set(key, data, ttl)
    return data
  }

  async invalidate(...keys: string[]): Promise<void> {
    await this.redisService.del(...keys)
  }

  async storeSessionContext(sessionId: string, context: unknown, ttlSeconds = 3600): Promise<void> {
    await this.redisService.set(`session:${sessionId}`, context, ttlSeconds)
  }

  async getSessionContext<T>(sessionId: string): Promise<T | null> {
    return this.redisService.get<T>(`session:${sessionId}`)
  }

  async storeJobStatus(jobId: string, status: unknown, ttlSeconds = 86400): Promise<void> {
    await this.redisService.set(`job:${jobId}`, status, ttlSeconds)
  }

  async getJobStatus<T>(jobId: string): Promise<T | null> {
    return this.redisService.get<T>(`job:${jobId}`)
  }

  async storeEphemeral(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.redisService.set(`ephemeral:${key}`, value, ttlSeconds)
  }

  async getEphemeral<T>(key: string): Promise<T | null> {
    return this.redisService.get<T>(`ephemeral:${key}`)
  }

  get ttl() {
    return DEFAULT_TTL
  }
}
