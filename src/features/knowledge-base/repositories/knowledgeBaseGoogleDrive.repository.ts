import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'
import type { SelectDriveFolderDto, UpdateDocumentsDto } from '../dto/knowledgeBaseGoogleDrive.dto'

@Injectable()
export class KnowledgeBaseGoogleDriveRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findGoogleDriveConfig(userId: string) {
    try {
      return await this.prisma.knowledgeBase.findFirst({ where: { type: 'googleDrive', userId } })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async createGoogleDriveConfig(userId: string, dto: SelectDriveFolderDto, accessToken: string, refreshToken: string) {
    try {
      return await this.prisma.knowledgeBase.create({
        data: {
          type: 'googleDrive',
          userId,
          folderId: dto.folderId,
          folderName: dto.folderName || '',
          accessToken,
          refreshToken,
          isActive: true,
          question: 'GoogleDrive Config',
          answer: 'GoogleDrive Configuration',
        },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async updateGoogleDriveConfig(userId: string, dto: SelectDriveFolderDto) {
    try {
      return await this.prisma.knowledgeBase.updateMany({
        where: { type: 'googleDrive', userId },
        data: {
          folderId: dto.folderId,
          folderName: dto.folderName || '',
          isActive: true,
        },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async deleteGoogleDriveConfig(userId: string) {
    try {
      return await this.prisma.knowledgeBase.deleteMany({ where: { type: 'googleDrive', userId } })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async findGoogleDriveDocumentsList(userId: string) {
    try {
      return await this.prisma.knowledgeBase.findMany({
        where: { type: 'googleDrive', userId, isActive: true },
        orderBy: { createdAt: 'desc' },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async updateGoogleDriveDocument(id: string, dto: UpdateDocumentsDto) {
    try {
      return await this.prisma.knowledgeBase.update({
        where: { id },
        data: { isActive: dto.isActive },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async deleteGoogleDriveDocument(id: string) {
    try {
      return await this.prisma.knowledgeBase.update({
        where: { id },
        data: { isActive: false },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }

  async deleteGoogleDriveDocuments(ids: string[]) {
    try {
      return await this.prisma.knowledgeBase.updateMany({
        where: { id: { in: ids } },
        data: { isActive: false },
      })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }
}
