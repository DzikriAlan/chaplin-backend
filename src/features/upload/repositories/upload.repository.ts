import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'

@Injectable()
export class UploadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUploadFile(data: { name: string; size: bigint; mimeType: string; storagePath: string; folderId?: string | null }) {
    try {
      return await this.prisma.uploadFile.create({ data })
    } catch (error) {
      throw handlePrismaError(error, 'upload')
    }
  }

  async findUploadFilesMany(folderId: string | null) {
    try {
      return await this.prisma.uploadFile.findMany({
        where: { folderId },
        orderBy: { createdAt: 'asc' },
      })
    } catch (error) {
      throw handlePrismaError(error, 'upload')
    }
  }

  async findUploadFileById(id: string) {
    try {
      return await this.prisma.uploadFile.findUnique({ where: { id } })
    } catch (error) {
      throw handlePrismaError(error, 'upload')
    }
  }

  async deleteUploadFile(id: string) {
    try {
      return await this.prisma.uploadFile.delete({ where: { id } })
    } catch (error) {
      throw handlePrismaError(error, 'upload')
    }
  }

  async findUploadFoldersTree() {
    try {
      return await this.prisma.uploadFolder.findMany({
        where: { parentId: null },
        include: {
          children: {
            include: {
              children: {
                include: {
                  children: true,
                  files: { select: { id: true, name: true, size: true, mimeType: true, createdAt: true } },
                },
              },
              files: { select: { id: true, name: true, size: true, mimeType: true, createdAt: true } },
            },
          },
          files: { select: { id: true, name: true, size: true, mimeType: true, createdAt: true } },
        },
        orderBy: { createdAt: 'asc' },
      })
    } catch (error) {
      throw handlePrismaError(error, 'upload')
    }
  }

  async createUploadFolder(name: string, parentId?: string | null) {
    try {
      return await this.prisma.uploadFolder.create({ data: { name: name.trim(), parentId: parentId ?? null } })
    } catch (error) {
      throw handlePrismaError(error, 'upload')
    }
  }

  async deleteUploadFolder(id: string) {
    try {
      return await this.prisma.uploadFolder.delete({ where: { id } })
    } catch (error) {
      throw handlePrismaError(error, 'upload')
    }
  }
}
