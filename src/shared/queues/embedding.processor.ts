import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { PrismaService } from '../prisma/prisma.service'
import { AiService } from '../services/ai.service'
import { QUEUES, EMBEDDING_JOBS } from './queue.constants'

interface FaqEmbedJob {
  id: string
  question: string
  answer: string
}

interface KbEmbedJob {
  id: string
  question: string
  answer: string
}

@Processor(QUEUES.EMBEDDING)
export class EmbeddingProcessor extends WorkerHost {
  private readonly logger = new Logger(EmbeddingProcessor.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {
    super()
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case EMBEDDING_JOBS.FAQ_EMBED:
        await this.processFaqEmbed(job.data as FaqEmbedJob)
        break
      case EMBEDDING_JOBS.KB_EMBED:
        await this.processKbEmbed(job.data as KbEmbedJob)
        break
      default:
        this.logger.warn(`Unknown job: ${job.name}`)
    }
  }

  private async processFaqEmbed(data: FaqEmbedJob): Promise<void> {
    this.logger.log(`Processing FAQ embedding for id: ${data.id}`)
    const embedding = await this.aiService.getEmbedding(`${data.question} ${data.answer}`)
    const vectorStr = `[${embedding.join(',')}]`
    await this.prisma.$executeRaw`UPDATE faq_manager SET embedding = ${vectorStr}::vector(1024) WHERE id = ${data.id}`
    this.logger.log(`FAQ embedding done: ${data.id}`)
  }

  private async processKbEmbed(data: KbEmbedJob): Promise<void> {
    this.logger.log(`Processing KB embedding for id: ${data.id}`)
    const embedding = await this.aiService.getEmbedding(`${data.question} ${data.answer}`)
    const vectorStr = `[${embedding.join(',')}]`
    await this.prisma.$executeRaw`UPDATE knowledge_base SET embedding = ${vectorStr}::vector(1024) WHERE id = ${data.id}`
    this.logger.log(`KB embedding done: ${data.id}`)
  }
}
