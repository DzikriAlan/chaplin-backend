import { Injectable } from '@nestjs/common'
import { DocStatus } from '@prisma/client'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'

@Injectable()
export class DocumentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findDocumentsMany() {
    try {
      return await this.prisma.document.findMany({
        orderBy: { updatedAt: 'desc' },
        include: { _count: { select: { chunks: true } } },
      })
    } catch (error) {
      throw handlePrismaError(error, 'document')
    }
  }

  async findDocumentFirst(where: Record<string, unknown>) {
    try {
      return await this.prisma.document.findFirst({ where: where as Parameters<typeof this.prisma.document.findFirst>[0]['where'] })
    } catch (error) {
      throw handlePrismaError(error, 'document')
    }
  }

  async updateDocumentsMany(ids: string[], status: DocStatus) {
    try {
      return await this.prisma.document.updateMany({ where: { id: { in: ids } }, data: { status } })
    } catch (error) {
      throw handlePrismaError(error, 'document')
    }
  }

  async updateDocumentManyByFilter(where: Record<string, unknown>, data: Record<string, unknown>) {
    try {
      return await this.prisma.document.updateMany({
        where: where as Parameters<typeof this.prisma.document.updateMany>[0]['where'],
        data: data as Parameters<typeof this.prisma.document.updateMany>[0]['data'],
      })
    } catch (error) {
      throw handlePrismaError(error, 'document')
    }
  }

  async deleteDocumentsWithChunks(ids: string[]) {
    try {
      await this.prisma.documentChunk.deleteMany({ where: { documentId: { in: ids } } })
      await this.prisma.document.deleteMany({ where: { id: { in: ids } } })
      await this.prisma.chatCache.deleteMany({})
    } catch (error) {
      throw handlePrismaError(error, 'document')
    }
  }

  async deleteAllDocuments() {
    try {
      await this.prisma.documentChunk.deleteMany({})
      await this.prisma.document.deleteMany({})
      await this.prisma.chatCache.deleteMany({})
    } catch (error) {
      throw handlePrismaError(error, 'document')
    }
  }

  async deleteChatCacheOnly() {
    try {
      return await this.prisma.chatCache.deleteMany({})
    } catch (error) {
      throw handlePrismaError(error, 'document')
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
      throw handlePrismaError(error, 'document')
    }
  }

  async findDriveConfig() {
    try {
      return await this.prisma.driveConfig.findFirst()
    } catch (error) {
      throw handlePrismaError(error, 'drive')
    }
  }

  async updateDriveConfigSyncAt(id: string) {
    try {
      return await this.prisma.driveConfig.update({ where: { id }, data: { lastSyncAt: new Date() } })
    } catch (error) {
      throw handlePrismaError(error, 'drive')
    }
  }
}
