import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'

@Injectable()
export class AiThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const forwarded = req.headers?.['x-forwarded-for'] as string | undefined
    const ip = forwarded?.split(',')[0]?.trim() ?? (req.ip as string) ?? 'unknown'
    return `ai:${ip}`
  }

  protected getThrottlers() {
    return [{ name: 'ai', ttl: 60000, limit: 20 }]
  }
}
