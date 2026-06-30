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

    const mapFile = (fi: (typeof files)[0]) => ({
      id: fi.id,
      name: fi.fileName ?? fi.question,
      size: Number(fi.size ?? 0),
      mimeType: fi.mimeType ?? '',
      storagePath: fi.fileUrl ?? '',
      folderId: fi.folderId ?? null,
      createdAt: fi.createdAt.toISOString(),
      updatedAt: fi.updatedAt.toISOString(),
    })

    const buildTree = (parentId: string | null): unknown[] =>
      folders
        .filter((f) => (f.folderId ?? null) === parentId)
        .map((f) => ({
          id: f.id,
          name: f.folderName ?? f.question,
          parentId: f.folderId ?? null,
          children: buildTree(f.id),
          files: files.filter((fi) => fi.folderId === f.id).map(mapFile),
          createdAt: f.createdAt.toISOString(),
          updatedAt: f.updatedAt.toISOString(),
        }))

    const tree = buildTree(null)

    // Files uploaded without a folder appear in a synthetic root entry
    const rootFiles = files.filter((fi) => !fi.folderId).map(mapFile)
    if (rootFiles.length > 0) {
      const now = new Date().toISOString()
      tree.unshift({ id: '__root__', name: 'Files', parentId: null, children: [], files: rootFiles, createdAt: now, updatedAt: now })
    }

    return tree
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
    return this.deleteRecord(id)
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
    return this.deleteRecord(id)
  }

  private async deleteRecord(id: string) {
    try {
      return await this.prisma.knowledgeBase.delete({ where: { id } })
    } catch (error) {
      throw handlePrismaError(error, 'knowledgeBase')
    }
  }
}
