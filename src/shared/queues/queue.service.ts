import { Injectable, Logger } from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { QUEUES, EMBEDDING_JOBS, DRIVE_SYNC_JOBS } from './queue.constants'

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name)

  constructor(
    @InjectQueue(QUEUES.EMBEDDING) private readonly embeddingQueue: Queue,
    @InjectQueue(QUEUES.DRIVE_SYNC) private readonly driveSyncQueue: Queue,
  ) {}

  async enqueueFaqEmbed(id: string, question: string, answer: string): Promise<void> {
    try {
      await this.embeddingQueue.add(
        EMBEDDING_JOBS.FAQ_EMBED,
        { id, question, answer },
        { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
      )
      this.logger.log(`FAQ embed enqueued: ${id}`)
    } catch (err: unknown) {
      this.logger.warn(`Failed to enqueue FAQ embed: ${String(err)}`)
    }
  }

  async enqueueKbEmbed(id: string, question: string, answer: string): Promise<void> {
    try {
      await this.embeddingQueue.add(
        EMBEDDING_JOBS.KB_EMBED,
        { id, question, answer },
        { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
      )
      this.logger.log(`KB embed enqueued: ${id}`)
    } catch (err: unknown) {
      this.logger.warn(`Failed to enqueue KB embed: ${String(err)}`)
    }
  }

  async enqueueProcessDocument(documentId: string): Promise<void> {
    try {
      await this.driveSyncQueue.add(
        DRIVE_SYNC_JOBS.PROCESS_DOCUMENT,
        { documentId },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      )
      this.logger.log(`Document process enqueued: ${documentId}`)
    } catch (err: unknown) {
      this.logger.warn(`Failed to enqueue document process: ${String(err)}`)
    }
  }

  async enqueueCronTick(): Promise<void> {
    try {
      await this.driveSyncQueue.add(
        DRIVE_SYNC_JOBS.RUN_CRON_TICK,
        {},
        { attempts: 2 },
      )
    } catch (err: unknown) {
      this.logger.warn(`Failed to enqueue cron tick: ${String(err)}`)
    }
  }
}
