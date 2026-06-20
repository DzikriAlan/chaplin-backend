import { Body, Controller, Delete, Get, HttpException, InternalServerErrorException, Logger, Post, Query } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { UploadService } from '../services/upload.service'
import type { CreateUploadSignedUrlDto, CreateUploadFolderDto } from '../dto/upload.dto'

@ApiTags('upload')
@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name)

  constructor(private readonly uploadService: UploadService) {}

  @Post('signed-url')
  @ApiOperation({ summary: 'Create signed upload URL' })
  async saveUploadSignedUrl(@Body() dto: CreateUploadSignedUrlDto) {
    try {
      return await this.uploadService.storeUploadSignedUrl(dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveUploadSignedUrl', error)
      throw new InternalServerErrorException()
    }
  }

  @Get('files')
  @ApiOperation({ summary: 'List uploaded files' })
  async fetchUploadFiles(@Query('folderId') folderId: string) {
    try {
      return await this.uploadService.getUploadFilesList(folderId ?? null)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchUploadFiles', error)
      throw new InternalServerErrorException()
    }
  }

  @Delete('files')
  @ApiOperation({ summary: 'Delete uploaded file' })
  async destroyUploadFiles(@Query('id') id: string) {
    try {
      return await this.uploadService.removeUploadFile(id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in destroyUploadFiles', error)
      throw new InternalServerErrorException()
    }
  }

  @Get('folders')
  @ApiOperation({ summary: 'List upload folders' })
  async fetchUploadFolders() {
    try {
      return await this.uploadService.getUploadFoldersList()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchUploadFolders', error)
      throw new InternalServerErrorException()
    }
  }

  @Post('folders')
  @ApiOperation({ summary: 'Create upload folder' })
  async saveUploadFolders(@Body() dto: CreateUploadFolderDto) {
    try {
      return await this.uploadService.storeUploadFolder(dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveUploadFolders', error)
      throw new InternalServerErrorException()
    }
  }

  @Delete('folders')
  @ApiOperation({ summary: 'Delete upload folder' })
  async destroyUploadFolders(@Query('id') id: string) {
    try {
      return await this.uploadService.removeUploadFolder(id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in destroyUploadFolders', error)
      throw new InternalServerErrorException()
    }
  }
}
