import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { DriveProcessorService } from '../services/drive-processor.service'
import { QUEUES, DRIVE_SYNC_JOBS } from './queue.constants'

interface ProcessDocumentJob {
  documentId: string
}

@Processor(QUEUES.DRIVE_SYNC)
export class DriveSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(DriveSyncProcessor.name)

  constructor(private readonly driveProcessorService: DriveProcessorService) {
    super()
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case DRIVE_SYNC_JOBS.PROCESS_DOCUMENT:
        await this.processDocument(job.data as ProcessDocumentJob)
        break
      case DRIVE_SYNC_JOBS.RUN_CRON_TICK:
        await this.runCronTick()
        break
      default:
        this.logger.warn(`Unknown drive-sync job: ${job.name}`)
    }
  }

  private async processDocument(data: ProcessDocumentJob): Promise<void> {
    this.logger.log(`Processing document via cron tick: ${data.documentId}`)
    await this.driveProcessorService.runCronTick()
    this.logger.log(`Document processed: ${data.documentId}`)
  }

  private async runCronTick(): Promise<void> {
    this.logger.log('Running drive cron tick via queue')
    await this.driveProcessorService.runCronTick()
  }
}
