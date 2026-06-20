import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaService } from './prisma/prisma.service'
import { AiService } from './services/ai.service'
import { SupabaseService } from './services/supabase.service'
import { DriveProcessorService } from './services/drive-processor.service'
import { RedisService } from './services/redis.service'
import { CacheService } from './services/cache.service'

@Module({
  imports: [ConfigModule],
  providers: [PrismaService, AiService, SupabaseService, DriveProcessorService, RedisService, CacheService],
  exports: [PrismaService, AiService, SupabaseService, DriveProcessorService, RedisService, CacheService],
})
export class SharedModule {}
