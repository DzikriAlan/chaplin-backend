import { Body, Controller, Delete, Get, HttpException, InternalServerErrorException, Logger, Patch, Post, Query, Res } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import type { Response } from 'express'
import { DriveService } from '../../drive/services/drive.service'
import { DocumentsService } from '../../documents/services/documents.service'
import type { SelectDriveFolderDto } from '../../drive/dto/drive.dto'
import type { UpdateDocumentsDto, DeleteDocumentsDto, SyncDocumentsDto } from '../../documents/dto/documents.dto'

@ApiTags('knowledge-base/google-drive')
@Controller('knowledge-base/google-drive')
export class KnowledgeBaseGoogleDriveController {
  private readonly logger = new Logger(KnowledgeBaseGoogleDriveController.name)

  constructor(
    private readonly driveService: DriveService,
    private readonly documentsService: DocumentsService,
  ) {}

  // ─── OAuth ───────────────────────────────────────────────────────────────────

  @Get('auth')
  @ApiOperation({ summary: 'Initiate Google Drive OAuth' })
  async fetchDriveAuth(@Res() res: Response) {
    try {
      const url = this.driveService.getDriveAuthUrl()
      res.redirect(url)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchDriveAuth', error)
      if (!res.headersSent) throw new InternalServerErrorException()
    }
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle Google Drive OAuth callback' })
  async fetchDriveCallback(
    @Query('code') code: string,
    @Query('folderId') folderId: string,
    @Res() res: Response,
  ) {
    try {
      const redirectUrl = await this.driveService.processDriveCallback(code, folderId)
      res.redirect(redirectUrl)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchDriveCallback', error)
      if (!res.headersSent) throw new InternalServerErrorException()
    }
  }

  // ─── Config ──────────────────────────────────────────────────────────────────

  @Get('config')
  @ApiOperation({ summary: 'Get Drive config' })
  async fetchDriveConfig() {
    try {
      return await this.driveService.getDriveConfig()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchDriveConfig', error)
      throw new InternalServerErrorException()
    }
  }

  @Delete('config')
  @ApiOperation({ summary: 'Delete Drive config and all documents' })
  async destroyDriveConfig() {
    try {
      return await this.driveService.removeDriveConfig()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in destroyDriveConfig', error)
      throw new InternalServerErrorException()
    }
  }

  // ─── Folders ─────────────────────────────────────────────────────────────────

  @Get('folders')
  @ApiOperation({ summary: 'List Google Drive folders' })
  async fetchDriveFolders() {
    try {
      return await this.driveService.getDriveFolders()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchDriveFolders', error)
      throw new InternalServerErrorException()
    }
  }

  @Post('folders')
  @ApiOperation({ summary: 'Select Google Drive folder and scan files' })
  async saveDriveFolders(@Body() dto: SelectDriveFolderDto) {
    try {
      return await this.driveService.storeDriveFolders(dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveDriveFolders', error)
      throw new InternalServerErrorException()
    }
  }

  // ─── Documents ───────────────────────────────────────────────────────────────

  @Get('documents')
  @ApiOperation({ summary: 'Get documents list' })
  async fetchDocumentsList() {
    try {
      return await this.documentsService.getDocumentsList()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchDocumentsList', error)
      throw new InternalServerErrorException()
    }
  }

  @Patch('documents')
  @ApiOperation({ summary: 'Update document status' })
  async modifyDocuments(@Body() dto: UpdateDocumentsDto) {
    try {
      return await this.documentsService.changeDocuments(dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in modifyDocuments', error)
      throw new InternalServerErrorException()
    }
  }

  @Delete('documents')
  @ApiOperation({ summary: 'Delete documents' })
  async destroyDocuments(@Query('id') id: string, @Body() dto: DeleteDocumentsDto) {
    try {
      return await this.documentsService.removeDocuments(id ?? null, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in destroyDocuments', error)
      throw new InternalServerErrorException()
    }
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync Google Drive documents' })
  async saveDocumentsSync(@Body() dto: SyncDocumentsDto) {
    try {
      return await this.documentsService.storeDocumentsSync(dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveDocumentsSync', error)
      throw new InternalServerErrorException()
    }
  }
}
