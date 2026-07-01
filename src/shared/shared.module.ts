import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaService } from './prisma/prisma.service'
import { AiService } from './services/ai.service'
import { SupabaseService } from './services/supabase.service'
import { RedisService } from './services/redis.service'
import { CacheService } from './services/cache.service'

@Module({
  imports: [ConfigModule],
  providers: [PrismaService, AiService, SupabaseService, RedisService, CacheService],
  exports: [PrismaService, AiService, SupabaseService, RedisService, CacheService],
})
export class SharedModule {}
