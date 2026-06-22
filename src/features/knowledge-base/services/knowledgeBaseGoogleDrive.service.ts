import { Injectable, Logger, InternalServerErrorException, BadRequestException, HttpException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { google } from 'googleapis'
import { KnowledgeBaseGoogleDriveRepository } from '../repositories/knowledgeBaseGoogleDrive.repository'
import type { SelectDriveFolderDto, UpdateDocumentsDto, DeleteDocumentsDto, SyncDocumentsDto } from '../dto/knowledgeBaseGoogleDrive.dto'

@Injectable()
export class KnowledgeBaseGoogleDriveService {
  private readonly logger = new Logger(KnowledgeBaseGoogleDriveService.name)

  constructor(
    private readonly driveRepository: KnowledgeBaseGoogleDriveRepository,
    private readonly configService: ConfigService,
  ) {}

  async fetchDriveAuthUrl(): Promise<string> {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID')
      const redirectUri = this.configService.get<string>('GOOGLE_DRIVE_REDIRECT_URI')

      if (!clientId || !redirectUri) {
        throw new BadRequestException('Google Drive OAuth credentials not configured')
      }

      const oauth2Client = new google.auth.OAuth2(clientId, this.configService.get<string>('GOOGLE_CLIENT_SECRET'), redirectUri)

      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.readonly'],
      })

      return authUrl
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get drive auth URL', error)
      throw new InternalServerErrorException('Failed to get drive auth URL')
    }
  }

  async storeDriveCallback(code: string, folderId: string, userId?: string): Promise<string> {
    try {
      if (!code) throw new BadRequestException('Authorization code is required')

      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID')
      const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET')
      const redirectUri = this.configService.get<string>('GOOGLE_DRIVE_REDIRECT_URI')

      if (!clientId || !clientSecret || !redirectUri) {
        throw new BadRequestException('Google Drive OAuth credentials not configured')
      }

      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
      const { tokens } = await oauth2Client.getToken(code)

      if (!tokens.access_token || !tokens.refresh_token) {
        throw new InternalServerErrorException('Failed to obtain access and refresh tokens')
      }

      const drive = google.drive({ version: 'v3', auth: oauth2Client })
      const folder = await drive.files.get({ fileId: folderId, fields: 'name,mimeType' })

      if (userId && folderId) {
        const existing = await this.driveRepository.getGoogleDriveConfig(userId)
        const folderDto = { folderId, folderName: folder.data.name || 'Unknown' }
        if (existing) {
          await this.driveRepository.patchGoogleDriveConfig(userId, folderDto)
        } else {
          await this.driveRepository.postGoogleDriveConfig(userId, folderDto, tokens.access_token, tokens.refresh_token)
        }
      }

      return `${redirectUri}?success=true&folderId=${folderId}&folderName=${folder.data.name || 'Unknown'}`
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to process drive callback', error)
      throw new InternalServerErrorException('Failed to process drive callback')
    }
  }

  async fetchDriveConfig(userId: string) {
    try {
      if (!userId) throw new BadRequestException('User ID is required')
      return await this.driveRepository.getGoogleDriveConfig(userId)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get Google Drive config', error)
      throw new InternalServerErrorException('Failed to get Google Drive config')
    }
  }

  async fetchDriveFolders(): Promise<Record<string, unknown>[]> {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID')
      const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET')
      const redirectUri = this.configService.get<string>('GOOGLE_DRIVE_REDIRECT_URI')

      if (!clientId || !clientSecret || !redirectUri) {
        throw new BadRequestException('Google Drive OAuth credentials not configured')
      }

      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
      const drive = google.drive({ version: 'v3', auth: oauth2Client })

      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
        spaces: 'drive',
        fields: 'files(id, name, mimeType)',
        pageSize: 50,
      })

      return (response.data.files || []) as Record<string, unknown>[]
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get Google Drive folders', error)
      throw new InternalServerErrorException('Failed to get Google Drive folders')
    }
  }

  async storeDriveFolders(userId: string, dto: SelectDriveFolderDto) {
    try {
      if (!userId) throw new BadRequestException('User ID is required')
      if (!dto.folderId) throw new BadRequestException('Folder ID is required')

      const existing = await this.driveRepository.getGoogleDriveConfig(userId)
      if (!existing) {
        throw new BadRequestException('Google Drive OAuth not completed. Please authorize first.')
      }

      const result = await this.driveRepository.patchGoogleDriveConfig(userId, dto)
      return result
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to store Google Drive folders', error)
      throw new InternalServerErrorException('Failed to store Google Drive folders')
    }
  }

  async removeDriveConfig(userId: string) {
    try {
      if (!userId) throw new BadRequestException('User ID is required')
      await this.driveRepository.deleteGoogleDriveConfig(userId)
      return { success: true }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to remove Google Drive config', error)
      throw new InternalServerErrorException('Failed to remove Google Drive config')
    }
  }

  async fetchDocumentsList(userId: string) {
    try {
      if (!userId) throw new BadRequestException('User ID is required')
      return await this.driveRepository.getGoogleDriveDocumentsList(userId)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get Google Drive documents list', error)
      throw new InternalServerErrorException('Failed to get Google Drive documents list')
    }
  }

  async changeDocuments(userId: string, dto: UpdateDocumentsDto) {
    try {
      if (!dto.id) throw new BadRequestException('Document ID is required')
      return await this.driveRepository.patchGoogleDriveDocument(dto.id, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to update Google Drive document', error)
      throw new InternalServerErrorException('Failed to update Google Drive document')
    }
  }

  async removeDocuments(userId: string, id: string | null, dto: DeleteDocumentsDto) {
    try {
      if (id) {
        return await this.driveRepository.deleteGoogleDriveDocument(id)
      }
      if (dto.ids && dto.ids.length > 0) {
        return await this.driveRepository.deleteGoogleDriveDocuments(dto.ids)
      }
      throw new BadRequestException('Document ID or IDs are required')
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to delete Google Drive documents', error)
      throw new InternalServerErrorException('Failed to delete Google Drive documents')
    }
  }

  async storeDocumentsSync(userId: string, dto: SyncDocumentsDto) {
    try {
      if (!userId) throw new BadRequestException('User ID is required')

      const config = await this.driveRepository.getGoogleDriveConfig(userId)
      if (!config) {
        throw new BadRequestException('Google Drive config not found')
      }

      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID')
      const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET')
      const redirectUri = this.configService.get<string>('GOOGLE_DRIVE_REDIRECT_URI')

      if (!clientId || !clientSecret || !redirectUri) {
        throw new BadRequestException('Google Drive OAuth credentials not configured')
      }

      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
      oauth2Client.setCredentials({ refresh_token: config.refreshToken })

      const drive = google.drive({ version: 'v3', auth: oauth2Client })

      const fileIds = dto.fileIds || []
      const fileQueries = fileIds.map((id) => `id='${id}'`).join(' or ')
      const query = fileIds.length > 0 ? `(${fileQueries})` : `'${config.folderId}' in parents and trashed=false`

      const response = await drive.files.list({
        q: query,
        spaces: 'drive',
        fields: 'files(id, name, mimeType, webViewLink)',
        pageSize: 100,
      })

      const files = response.data.files || []
      const synced = files.length

      return { success: true, synced, total: files.length }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to sync documents', error)
      throw new InternalServerErrorException('Failed to sync documents')
    }
  }
}
