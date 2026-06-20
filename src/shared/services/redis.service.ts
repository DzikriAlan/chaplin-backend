import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private client: Redis

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379')
    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) return null
        return Math.min(times * 200, 2000)
      },
    })

    this.client.on('error', (err: Error) => {
      this.logger.warn(`Redis connection error: ${err.message}`)
    })

    this.client.on('connect', () => {
      this.logger.log('Redis connected')
    })

    this.client.connect().catch((err: Error) => {
      this.logger.warn(`Redis initial connect failed: ${err.message}`)
    })
  }

  async onModuleDestroy() {
    await this.client?.quit()
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key)
      if (!value) return null
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds)
    } catch (err: unknown) {
      this.logger.warn(`Redis set failed: ${String(err)}`)
    }
  }

  async del(...keys: string[]): Promise<void> {
    try {
      await this.client.del(...keys)
    } catch (err: unknown) {
      this.logger.warn(`Redis del failed: ${String(err)}`)
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const count = await this.client.exists(key)
      return count > 0
    } catch {
      return false
    }
  }

  async increment(key: string, ttlSeconds = 60): Promise<number> {
    try {
      const count = await this.client.incr(key)
      if (count === 1) await this.client.expire(key, ttlSeconds)
      return count
    } catch {
      return 0
    }
  }

  async getClient(): Promise<Redis> {
    return this.client
  }

  async publish(channel: string, message: unknown): Promise<void> {
    try {
      await this.client.publish(channel, JSON.stringify(message))
    } catch (err: unknown) {
      this.logger.warn(`Redis publish failed: ${String(err)}`)
    }
  }

  async hset(key: string, field: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      await this.client.hset(key, field, JSON.stringify(value))
      if (ttlSeconds) await this.client.expire(key, ttlSeconds)
    } catch (err: unknown) {
      this.logger.warn(`Redis hset failed: ${String(err)}`)
    }
  }

  async hget<T>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.client.hget(key, field)
      if (!value) return null
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  async hgetall<T>(key: string): Promise<Record<string, T> | null> {
    try {
      const raw = await this.client.hgetall(key)
      if (!raw || Object.keys(raw).length === 0) return null
      const result: Record<string, T> = {}
      for (const [field, value] of Object.entries(raw)) {
        try {
          result[field] = JSON.parse(value) as T
        } catch {
          result[field] = value as unknown as T
        }
      }
      return result
    } catch {
      return null
    }
  }
}
