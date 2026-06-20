import { HttpException, Injectable, BadRequestException, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common'
import { UploadRepository } from '../repositories/upload.repository'
import { SupabaseService } from '../../../shared/services/supabase.service'
import type { CreateUploadSignedUrlDto, CreateUploadFolderDto } from '../dto/upload.dto'

const STORAGE_BUCKET = 'uploads'

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name)

  constructor(
    private readonly uploadRepository: UploadRepository,
    private readonly supabaseService: SupabaseService,
  ) {}

  async storeUploadSignedUrl(dto: CreateUploadSignedUrlDto) {
    try {
      if (!dto.fileName || !dto.mimeType || !dto.size) {
        throw new BadRequestException('fileName, mimeType, dan size wajib diisi')
      }

      const folderPath = dto.folderId ? `folders/${dto.folderId}` : 'root'
      const storagePath = `${folderPath}/${Date.now()}_${dto.fileName}`

      const { data, error } = await this.supabaseService.storage
        .from(STORAGE_BUCKET)
        .createSignedUploadUrl(storagePath)

      if (error ?? !data) throw new BadRequestException('Gagal membuat signed URL')

      const uploadFile = await this.uploadRepository.createUploadFile({
        name: dto.fileName,
        size: BigInt(dto.size),
        mimeType: dto.mimeType,
        storagePath,
        folderId: dto.folderId ?? null,
      })

      return { signedUrl: data.signedUrl, token: data.token, path: storagePath, fileId: uploadFile.id }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to store upload signed URL', error)
      throw new InternalServerErrorException('Failed to create signed URL')
    }
  }

  async getUploadFilesList(folderId: string | null) {
    try {
      return await this.uploadRepository.findUploadFilesMany(folderId)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get upload files list', error)
      throw new InternalServerErrorException('Failed to get upload files list')
    }
  }

  async removeUploadFile(id: string) {
    try {
      const file = await this.uploadRepository.findUploadFileById(id)
      if (!file) throw new NotFoundException('File tidak ditemukan')

      await this.supabaseService.storage.from(STORAGE_BUCKET).remove([file.storagePath])
      await this.uploadRepository.deleteUploadFile(id)
      return { success: true }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to remove upload file', error)
      throw new InternalServerErrorException('Failed to remove upload file')
    }
  }

  async getUploadFoldersList() {
    try {
      return await this.uploadRepository.findUploadFoldersTree()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get upload folders list', error)
      throw new InternalServerErrorException('Failed to get upload folders list')
    }
  }

  async storeUploadFolder(dto: CreateUploadFolderDto) {
    try {
      if (!dto.name?.trim()) throw new BadRequestException('Nama folder wajib diisi')
      return await this.uploadRepository.createUploadFolder(dto.name, dto.parentId)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to store upload folder', error)
      throw new InternalServerErrorException('Failed to create upload folder')
    }
  }

  async removeUploadFolder(id: string) {
    try {
      await this.uploadRepository.deleteUploadFolder(id)
      return { success: true }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to remove upload folder', error)
      throw new InternalServerErrorException('Failed to remove upload folder')
    }
  }
}
