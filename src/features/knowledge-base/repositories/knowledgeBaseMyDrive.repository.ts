import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'
import type { CreateUploadFolderDto, CreateUploadSignedUrlDto } from '../dto/knowledgeBaseMyDrive.dto'

@Injectable()
export class KnowledgeBaseMyDriveRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getMyDriveFoldersList(userId: string) {
    const all = await this.prisma.knowledgeBase.findMany({
      where: { type: 'myDrive', userId },
      orderBy: { createdAt: 'asc' },
    }).catch((error) => { throw handlePrismaError(error, 'knowledgeBase') })

    const folders = all.filter((r) => !r.fileUrl)
    const files = all.filter((r) => !!r.fileUrl)

    const buildTree = (parentId: string | null): unknown[] =>
      folders
        .filter((f) => (f.folderId ?? null) === parentId)
        .map((f) => ({
          id: f.id,
          name: f.folderName ?? f.question,
          parentId: f.folderId ?? null,
          children: buildTree(f.id),
          files: files
            .filter((fi) => fi.folderId === f.id)
            .map((fi) => ({
              id: fi.id,
              name: fi.fileName ?? fi.question,
              size: Number(fi.size ?? 0),
              mimeType: fi.mimeType ?? '',
              storagePath: fi.fileUrl ?? '',
              folderId: fi.folderId ?? null,
              createdAt: fi.createdAt.toISOString(),
              updatedAt: fi.updatedAt.toISOString(),
            })),
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString(),
        }))

    return buildTree(null)
  }

  async postMyDriveFolder(userId: string, dto: CreateUploadFolderDto) {
    try {
      return await this.prisma.knowledgeBase.create({
        data: {
          type: 'myDrive',
          userId,
          folderName: dto.name,
          folderId: dto.parentId ?? null,
          description: dto.description ?? null,
          question: dto.name,
          answer: dto.description ?? 'Folder',
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

  async postMyDriveFile(userId: string, dto: CreateUploadSignedUrlDto, storagePath: string) {
    try {
      return await this.prisma.knowledgeBase.create({
        data: {
          type: 'myDrive',
          userId,
          folderId: dto.folderId ?? null,
          fileName: dto.fileName,
          mimeType: dto.mimeType,
          fileUrl: storagePath,
          size: dto.size ?? 0,
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
