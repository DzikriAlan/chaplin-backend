import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'
import type { CreateUploadFolderDto, CreateUploadSignedUrlDto } from '../dto/knowledgeBaseMyDrive.dto'

@Injectable()
export class KnowledgeBaseMyDriveRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getMyDriveFoldersList(userId: string) {
    try {
      return await this.prisma.knowledgeBase.findMany({
        where: { type: 'myDrive', userId, fileUrl: null },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async postMyDriveFolder(userId: string, dto: CreateUploadFolderDto) {
    try {
      return await this.prisma.knowledgeBase.create({
        data: {
          type: 'myDrive',
          userId,
          folderName: dto.folderName,
          description: dto.description || null,
          question: dto.folderName,
          answer: dto.description || 'Folder',
        },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async deleteMyDriveFolder(id: string) {
    try {
      return await this.prisma.knowledgeBase.delete({ where: { id } })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async getMyDriveFilesList(userId: string, folderId?: string | null) {
    try {
      return await this.prisma.knowledgeBase.findMany({
        where: {
          type: 'myDrive',
          userId,
          folderId: folderId || undefined,
          fileUrl: { not: null },
        },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async postMyDriveFile(userId: string, dto: CreateUploadSignedUrlDto, fileUrl: string, size: number) {
    try {
      return await this.prisma.knowledgeBase.create({
        data: {
          type: 'myDrive',
          userId,
          folderId: dto.folderId || null,
          fileName: dto.fileName,
          mimeType: dto.mimeType,
          fileUrl,
          size,
          question: dto.fileName,
          answer: dto.mimeType,
        },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async deleteMyDriveFile(id: string) {
    try {
      return await this.prisma.knowledgeBase.delete({ where: { id } })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }
}
