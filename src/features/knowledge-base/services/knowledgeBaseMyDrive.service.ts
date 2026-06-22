import { Injectable, Logger, InternalServerErrorException, BadRequestException, HttpException } from '@nestjs/common'
import { KnowledgeBaseMyDriveRepository } from '../repositories/knowledgeBaseMyDrive.repository'
import type { CreateUploadSignedUrlDto, CreateUploadFolderDto } from '../dto/knowledgeBaseMyDrive.dto'

@Injectable()
export class KnowledgeBaseMyDriveService {
  private readonly logger = new Logger(KnowledgeBaseMyDriveService.name)

  constructor(private readonly uploadRepository: KnowledgeBaseMyDriveRepository) {}

  async storeUploadSignedUrl(userId: string, dto: CreateUploadSignedUrlDto) {
    try {
      if (!userId) throw new BadRequestException('User ID is required')
      if (!dto.fileName || !dto.mimeType) throw new BadRequestException('File name and MIME type are required')
      // TODO: Generate actual signed URL from S3 or cloud storage
      const fileId = `file-${Date.now()}`
      return {
        myDriveSignedUrl: `https://storage.example.com/upload/${fileId}`,
        myDriveFileId: fileId,
        myDriveExpiresIn: 3600,
      }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to create My Drive signed URL', error)
      throw new InternalServerErrorException('Failed to create My Drive signed URL')
    }
  }

  async fetchUploadFilesList(userId: string, folderId: string | null) {
    try {
      if (!userId) throw new BadRequestException('User ID is required')
      return await this.uploadRepository.getMyDriveFilesList(userId, folderId)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get My Drive files list', error)
      throw new InternalServerErrorException('Failed to get My Drive files list')
    }
  }

  async removeUploadFile(userId: string, id: string) {
    try {
      if (!id) throw new BadRequestException('File ID is required')
      await this.uploadRepository.deleteMyDriveFile(id)
      return { success: true }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to delete My Drive file', error)
      throw new InternalServerErrorException('Failed to delete My Drive file')
    }
  }

  async fetchUploadFoldersList(userId: string) {
    try {
      if (!userId) throw new BadRequestException('User ID is required')
      return await this.uploadRepository.getMyDriveFoldersList(userId)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get My Drive folders list', error)
      throw new InternalServerErrorException('Failed to get My Drive folders list')
    }
  }

  async storeUploadFolder(userId: string, dto: CreateUploadFolderDto) {
    try {
      if (!userId) throw new BadRequestException('User ID is required')
      if (!dto.folderName) throw new BadRequestException('Folder name is required')
      return await this.uploadRepository.postMyDriveFolder(userId, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to create My Drive folder', error)
      throw new InternalServerErrorException('Failed to create My Drive folder')
    }
  }

  async removeUploadFolder(userId: string, id: string) {
    try {
      if (!id) throw new BadRequestException('Folder ID is required')
      await this.uploadRepository.deleteMyDriveFolder(id)
      return { success: true }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to delete My Drive folder', error)
      throw new InternalServerErrorException('Failed to delete My Drive folder')
    }
  }
}
