import { HttpException, Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { google } from 'googleapis'
import { DriveRepository } from '../repositories/drive.repository'
import { DriveProcessorService } from '../../../shared/services/drive-processor.service'
import type { SelectDriveFolderDto } from '../dto/drive.dto'

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
export class DriveService {
  private readonly logger = new Logger(DriveService.name)

  constructor(
    private readonly configService: ConfigService,
    private readonly driveRepository: DriveRepository,
    private readonly driveProcessorService: DriveProcessorService,
  ) {}

  getDriveAuthUrl(): string {
    const auth = this.driveProcessorService.buildOAuth2Client()
    return auth.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/drive.readonly'],
    })
  }

  async processDriveCallback(code: string, folderId?: string): Promise<string> {
    const auth = this.driveProcessorService.buildOAuth2Client()
    let tokens
    try {
      const result = await auth.getToken(code)
      tokens = result.tokens
    } catch {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')
      return `${frontendUrl}/documents?error=oauth_failed`
    }

    if (!tokens.refresh_token) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')
      return `${frontendUrl}/documents?error=no_refresh_token`
    }

    try {
      const targetFolderId = folderId ?? 'root'
      let folderName = 'My Drive'

      if (targetFolderId !== 'root') {
        auth.setCredentials(tokens)
        const drive = google.drive({ version: 'v3', auth })
        const folder = await drive.files.get({ fileId: targetFolderId, fields: 'name' })
        folderName = folder.data.name ?? 'Folder'
      }

      await this.saveOrUpdateConfig(targetFolderId, folderName, tokens.refresh_token)
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')
      return `${frontendUrl}/documents?pick-folder=true`
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to process drive callback', error)
      throw new InternalServerErrorException('Failed to process drive callback')
    }
  }

  async getDriveConfig() {
    try {
      return await this.driveRepository.findDriveConfigSelect()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get drive config', error)
      throw new InternalServerErrorException('Failed to get drive config')
    }
  }

  async removeDriveConfig() {
    try {
      await this.driveRepository.deleteDriveAll()
      return { success: true }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to remove drive config', error)
      throw new InternalServerErrorException('Failed to remove drive config')
    }
  }

  async getDriveFolders() {
    try {
      const config = await this.driveRepository.findDriveConfig()
      if (!config) throw new BadRequestException('Google Drive belum dikonfigurasi')

      const auth = this.driveProcessorService.buildOAuth2Client()
      auth.setCredentials({ refresh_token: config.refreshToken })

      const drive = google.drive({ version: 'v3', auth })
      const response = await drive.files.list({
        q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false and 'root' in parents",
        fields: 'files(id, name)',
        orderBy: 'name',
        pageSize: 50,
      })
      const folderFiles: { id: string; name: string }[] = []
      for (const f of response.data.files ?? []) {
        if (f.id && f.name) folderFiles.push({ id: f.id, name: f.name })
      }
      return folderFiles
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get drive folders', error)
      throw new InternalServerErrorException('Failed to get drive folders')
    }
  }

  async storeDriveFolders(dto: SelectDriveFolderDto) {
    try {
      if (!dto.folderId) throw new BadRequestException('folderId required')

      const config = await this.driveRepository.findDriveConfig()
      if (!config) throw new BadRequestException('Google Drive belum dikonfigurasi')

      await this.driveRepository.updateDriveConfig(config.id, {
        folderId: dto.folderId,
        folderName: dto.folderName ?? dto.folderId,
      })

      const auth = this.driveProcessorService.buildOAuth2Client()
      auth.setCredentials({ refresh_token: config.refreshToken })

      const drive = google.drive({ version: 'v3', auth })
      const fileRes = await drive.files.list({
        q: `'${dto.folderId}' in parents and trashed = false`,
        fields: 'files(id, name, mimeType, shortcutDetails)',
        pageSize: 100,
      })

      const files = fileRes.data.files ?? []
      let added = 0
      for (const file of files) {
        const resolved = this.resolveFile(file)
        if (!resolved) continue
        await this.driveRepository.upsertDocument(resolved.id, resolved.name, resolved.mimeType)
        added++
      }
      await this.driveRepository.updateDriveConfig(config.id, { lastSyncAt: new Date() })
      return { added }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to store drive folders', error)
      throw new InternalServerErrorException('Failed to store drive folders')
    }
  }

  private async saveOrUpdateConfig(folderId: string, folderName: string, refreshToken: string) {
    const existing = await this.driveRepository.findDriveConfig()
    if (existing) {
      await this.driveRepository.updateDriveConfig(existing.id, { folderId, folderName, refreshToken })
    } else {
      await this.driveRepository.createDriveConfig(folderId, folderName, refreshToken)
    }
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
