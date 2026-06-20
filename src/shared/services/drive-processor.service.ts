import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { google } from 'googleapis'
import type { OAuth2Client } from 'google-auth-library'
import { PrismaService } from '../prisma/prisma.service'
import { AiService } from './ai.service'

const SUPPORTED_MIME_TYPES: Record<string, string> = {
  'application/vnd.google-apps.document': 'text/plain',
  'application/vnd.google-apps.presentation': 'text/plain',
  'application/vnd.google-apps.spreadsheet': 'text/csv',
  'application/pdf': 'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'text/plain',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'text/plain',
  'text/plain': 'text/plain',
}

@Injectable()
export class DriveProcessorService {
  private cronRunning = false
  private cronPaused = false

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  buildOAuth2Client(): OAuth2Client {
    return new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_DRIVE_REDIRECT_URI'),
    )
  }

  pauseCron(): void {
    this.cronPaused = true
  }

  resumeCron(): void {
    this.cronPaused = false
  }

  isCronPaused(): boolean {
    return this.cronPaused
  }

  async processDocument(
    auth: OAuth2Client,
    doc: { id: string; driveId: string; mimeType: string; title: string },
  ): Promise<void> {
    await this.prisma.document.updateMany({ where: { id: doc.id }, data: { status: 'PROCESSING' } })
    try {
      const text = await this.downloadDocumentText(auth, doc)
      if (!text) {
        await this.prisma.document.update({ where: { id: doc.id }, data: { status: 'ERROR' } })
        return
      }

      const chunks = this.aiService.chunkText(text)
      await this.prisma.documentChunk.deleteMany({ where: { documentId: doc.id } })

      for (let i = 0; i < chunks.length; i++) {
        await this.processChunk(doc.id, doc.title, chunks[i], i)
      }

      await this.prisma.document.updateMany({ where: { id: doc.id }, data: { status: 'READY' } })
    } catch {
      await this.prisma.document.updateMany({ where: { id: doc.id }, data: { status: 'ERROR' } })
    }
  }

  async runCronTick(): Promise<void> {
    if (this.cronRunning || this.cronPaused) return
    this.cronRunning = true
    try {
      const config = await this.prisma.driveConfig.findFirst()
      if (!config?.refreshToken) return

      const pending = await this.prisma.document.findFirst({ where: { status: 'PENDING' } })
      if (!pending) return

      const auth = this.buildOAuth2Client()
      auth.setCredentials({ refresh_token: config.refreshToken })
      await this.processDocument(auth, pending)
    } finally {
      this.cronRunning = false
    }
  }

  private async downloadDocumentText(
    auth: OAuth2Client,
    doc: { driveId: string; mimeType: string },
  ): Promise<string> {
    const drive = google.drive({ version: 'v3', auth })
    const exportMime = SUPPORTED_MIME_TYPES[doc.mimeType] ?? 'text/plain'
    const isNativeDoc = doc.mimeType.startsWith('application/vnd.google-apps.')

    let text = ''
    if (isNativeDoc) {
      const exported = await drive.files.export(
        { fileId: doc.driveId, mimeType: exportMime },
        { responseType: 'text' },
      )
      text = typeof exported.data === 'string' ? exported.data : JSON.stringify(exported.data)
    } else {
      const downloaded = await drive.files.get(
        { fileId: doc.driveId, alt: 'media' },
        { responseType: 'text' },
      )
      text = typeof downloaded.data === 'string' ? downloaded.data : JSON.stringify(downloaded.data)
    }
    return text.trim()
  }

  private async processChunk(
    documentId: string,
    title: string,
    content: string,
    index: number,
  ): Promise<void> {
    const embedding = await this.aiService.getEmbedding(content)
    const chunk = await this.prisma.documentChunk.create({
      data: { documentId, content, chunkIndex: index, metadata: { title } },
    })
    const vectorStr = `[${embedding.join(',')}]`
    await this.prisma.$executeRaw`UPDATE "document_chunks" SET embedding = ${vectorStr}::vector(1024) WHERE id = ${chunk.id}`
  }
}
