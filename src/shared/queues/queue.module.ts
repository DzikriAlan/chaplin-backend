import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { QUEUES } from './queue.constants'
import { EmbeddingProcessor } from './embedding.processor'
import { DriveSyncProcessor } from './drive-sync.processor'
import { QueueService } from './queue.service'
import { SharedModule } from '../shared.module'

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          maxRetriesPerRequest: null,
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUES.EMBEDDING },
      { name: QUEUES.DRIVE_SYNC },
    ),
    SharedModule,
  ],
  providers: [EmbeddingProcessor, DriveSyncProcessor, QueueService],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
