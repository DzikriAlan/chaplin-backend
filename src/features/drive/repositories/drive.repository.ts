import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'

@Injectable()
export class DriveRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDriveConfig() {
    try {
      return await this.prisma.driveConfig.findFirst()
    } catch (error) {
      throw handlePrismaError(error, 'drive')
    }
  }

  async findDriveConfigSelect() {
    try {
      return await this.prisma.driveConfig.findFirst({
        select: { id: true, folderId: true, folderName: true, lastSyncAt: true },
      })
    } catch (error) {
      throw handlePrismaError(error, 'drive')
    }
  }

  async createDriveConfig(folderId: string, folderName: string, refreshToken: string) {
    try {
      return await this.prisma.driveConfig.create({ data: { folderId, folderName, refreshToken } })
    } catch (error) {
      throw handlePrismaError(error, 'drive')
    }
  }

  async updateDriveConfig(id: string, data: { folderId?: string; folderName?: string; refreshToken?: string; lastSyncAt?: Date }) {
    try {
      return await this.prisma.driveConfig.update({ where: { id }, data })
    } catch (error) {
      throw handlePrismaError(error, 'drive')
    }
  }

  async deleteDriveAll() {
    try {
      await this.prisma.documentChunk.deleteMany({})
      await this.prisma.document.deleteMany({})
      await this.prisma.driveConfig.deleteMany({})
    } catch (error) {
      throw handlePrismaError(error, 'drive')
    }
  }

  async upsertDocument(driveId: string, title: string, mimeType: string) {
    try {
      return await this.prisma.document.upsert({
        where: { driveId },
        update: {},
        create: { title, mimeType, driveId, status: 'PENDING' },
      })
    } catch (error) {
      throw handlePrismaError(error, 'drive')
    }
  }
}
