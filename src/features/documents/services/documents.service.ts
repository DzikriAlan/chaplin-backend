import { HttpException, Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common'
import { google } from 'googleapis'
import { DocStatus } from '@prisma/client'
import { DocumentsRepository } from '../repositories/documents.repository'
import { DriveProcessorService } from '../../../shared/services/drive-processor.service'
import type { UpdateDocumentsDto, DeleteDocumentsDto, SyncDocumentsDto } from '../dto/documents.dto'

const SUPPORTED_MIME_TYPES = new Set([
  'application/vnd.google-apps.document',
  'application/vnd.google-apps.presentation',
  'application/vnd.google-apps.spreadsheet',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
])

interface DriveFile {
  id?: string | null
  name?: string | null
  mimeType?: string | null
  shortcutDetails?: { targetId?: string | null; targetMimeType?: string | null } | null
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name)

  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly driveProcessorService: DriveProcessorService,
  ) {}

  async getDocumentsList() {
    try {
      return await this.documentsRepository.findDocumentsMany()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get documents list', error)
      throw new InternalServerErrorException('Failed to get documents list')
    }
  }

  async changeDocuments(dto: UpdateDocumentsDto) {
    try {
      const status = dto.action === 'skip' ? DocStatus.ERROR : DocStatus.PENDING
      const singleIdArray = dto.id ? [dto.id] : []
      const ids = dto.ids?.length ? dto.ids : singleIdArray
      if (!ids.length) throw new BadRequestException('Missing id or ids')
      await this.documentsRepository.updateDocumentsMany(ids, status)
      return { success: true }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to change documents', error)
      throw new InternalServerErrorException('Failed to update documents')
    }
  }

  async removeDocuments(id: string | null, dto: DeleteDocumentsDto) {
    try {
      if (id) {
        await this.documentsRepository.deleteDocumentsWithChunks([id])
        return { success: true }
      }
      if (dto.all) {
        await this.documentsRepository.deleteAllDocuments()
        return { success: true }
      }
      if (dto.ids?.length) {
        await this.documentsRepository.deleteDocumentsWithChunks(dto.ids)
        return { success: true }
      }
      throw new BadRequestException('Missing id, ids, or all')
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to remove documents', error)
      throw new InternalServerErrorException('Failed to remove documents')
    }
  }

  async storeDocumentsSync(dto: SyncDocumentsDto) {
    try {
      const config = await this.documentsRepository.findDriveConfig()
      if (!config) throw new BadRequestException('Google Drive belum dikonfigurasi')

      const auth = this.driveProcessorService.buildOAuth2Client()
      auth.setCredentials({ refresh_token: config.refreshToken })

      if (dto.action === 'list') return this.syncDriveFiles(config, auth)
      if (dto.action === 'pause') return this.pauseSync()
      if (dto.action === 'resume') return this.resumeSync()
      if (dto.action === 'process-all') return this.triggerProcessAll(auth)

      return this.processNextPending(auth)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to store documents sync', error)
      throw new InternalServerErrorException('Failed to sync documents')
    }
  }

  private async syncDriveFiles(
    config: { id: string; folderId: string },
    auth: ReturnType<typeof this.driveProcessorService.buildOAuth2Client>,
  ) {
    const drive = google.drive({ version: 'v3', auth })
    const response = await drive.files.list({
      q: `'${config.folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, shortcutDetails)',
      pageSize: 100,
    })
    const files = response.data.files ?? []
    let added = 0
    for (const file of files) {
      const resolved = this.resolveFile(file)
      if (!resolved) continue
      await this.documentsRepository.upsertDocument(resolved.id, resolved.name, resolved.mimeType)
      added++
    }
    await this.documentsRepository.updateDriveConfigSyncAt(config.id)
    return { added }
  }

  private async pauseSync() {
    this.driveProcessorService.pauseCron()
    await this.documentsRepository.updateDocumentManyByFilter({ status: 'PROCESSING' }, { status: 'PENDING' })
    return { paused: true }
  }

  private resumeSync() {
    this.driveProcessorService.resumeCron()
    return { paused: false }
  }

  private triggerProcessAll(auth: ReturnType<typeof this.driveProcessorService.buildOAuth2Client>) {
    this.driveProcessorService.resumeCron()
    void this.runProcessAllInBackground(auth)
    return { message: 'Processing started in background' }
  }

  private async runProcessAllInBackground(auth: ReturnType<typeof this.driveProcessorService.buildOAuth2Client>) {
    const all = await this.documentsRepository.findDocumentsMany()
    const pending = all.filter((d) => d.status === 'PENDING')
    for (const doc of pending) {
      await this.driveProcessorService.processDocument(auth, doc)
    }
    await this.documentsRepository.deleteChatCacheOnly()
  }

  private async processNextPending(auth: ReturnType<typeof this.driveProcessorService.buildOAuth2Client>) {
    const pending = await this.documentsRepository.findDocumentFirst({ status: 'PENDING' })
    if (!pending) return { done: true }
    await this.driveProcessorService.processDocument(auth, pending)
    await this.documentsRepository.deleteChatCacheOnly()
    return { processed: pending.title }
  }

  private resolveFile(file: DriveFile): { id: string; name: string; mimeType: string } | null {
    let id = file.id
    let mimeType = file.mimeType
    const name = file.name
    if (!name) return null
    if (mimeType === 'application/vnd.google-apps.shortcut') {
      id = file.shortcutDetails?.targetId ?? null
      mimeType = file.shortcutDetails?.targetMimeType ?? null
    }
    if (!id || !mimeType || !SUPPORTED_MIME_TYPES.has(mimeType)) return null
    return { id, name, mimeType }
  }
}
