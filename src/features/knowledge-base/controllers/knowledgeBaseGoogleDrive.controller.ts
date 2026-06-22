import { Body, Controller, Delete, Get, HttpException, InternalServerErrorException, Logger, Patch, Post, Query, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger'
import type { Response } from 'express'
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard'
import { CurrentUser, type CurrentUserPayload } from '../../../shared/decorators/current-user.decorator'
import { KnowledgeBaseGoogleDriveService } from '../services/knowledgeBaseGoogleDrive.service'
import type { SelectDriveFolderDto, UpdateDocumentsDto, DeleteDocumentsDto, SyncDocumentsDto } from '../dto/knowledgeBaseGoogleDrive.dto'

@ApiTags('knowledge-base/google-drive')
@Controller('knowledge-base/google-drive')
export class KnowledgeBaseGoogleDriveController {
  private readonly logger = new Logger(KnowledgeBaseGoogleDriveController.name)

  constructor(private readonly googleDriveService: KnowledgeBaseGoogleDriveService) {}

  // ─── OAuth ───────────────────────────────────────────────────────────────────

  @Get('auth')
  @ApiOperation({ summary: 'Initiate Google Drive OAuth' })
  async loadDriveAuth(@Res() res: Response) {
    try {
      const url = await this.googleDriveService.fetchDriveAuthUrl()
      res.redirect(url)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in loadDriveAuth', error)
      if (!res.headersSent) throw new InternalServerErrorException()
    }
  }

  @Get('callback')
  @ApiOperation({ summary: 'Handle Google Drive OAuth callback' })
  async loadDriveCallback(
    @Query('code') code: string,
    @Query('folderId') folderId: string,
    @Query('state') state?: string,
    @Res() res?: Response,
  ) {
    try {
      const redirectUrl = await this.googleDriveService.storeDriveCallback(code, folderId, state)
      if (res) res.redirect(redirectUrl)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in loadDriveCallback', error)
      if (res && !res.headersSent) throw new InternalServerErrorException()
    }
  }

  // ─── Config ──────────────────────────────────────────────────────────────────

  @Get('config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Drive config' })
  async loadDriveConfig(@CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.googleDriveService.fetchDriveConfig(user.id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in loadDriveConfig', error)
      throw new InternalServerErrorException()
    }
  }

  @Delete('config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete Drive config and all documents' })
  async destroyDriveConfig(@CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.googleDriveService.removeDriveConfig(user.id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in destroyDriveConfig', error)
      throw new InternalServerErrorException()
    }
  }

  // ─── Folders ─────────────────────────────────────────────────────────────────

  @Get('folders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List Google Drive folders' })
  async loadDriveFolders() {
    try {
      return await this.googleDriveService.fetchDriveFolders()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in loadDriveFolders', error)
      throw new InternalServerErrorException()
    }
  }

  @Post('folders')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Select Google Drive folder and scan files' })
  async saveDriveFolders(@CurrentUser() user: CurrentUserPayload, @Body() dto: SelectDriveFolderDto) {
    try {
      return await this.googleDriveService.storeDriveFolders(user.id, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveDriveFolders', error)
      throw new InternalServerErrorException()
    }
  }

  // ─── Documents ───────────────────────────────────────────────────────────────

  @Get('documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get documents list' })
  async loadDocumentsList(@CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.googleDriveService.fetchDocumentsList(user.id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in loadDocumentsList', error)
      throw new InternalServerErrorException()
    }
  }

  @Patch('documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update document status' })
  async modifyDocuments(@CurrentUser() user: CurrentUserPayload, @Body() dto: UpdateDocumentsDto) {
    try {
      return await this.googleDriveService.changeDocuments(user.id, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in modifyDocuments', error)
      throw new InternalServerErrorException()
    }
  }

  @Delete('documents')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete documents' })
  async destroyDocuments(@CurrentUser() user: CurrentUserPayload, @Query('id') id: string, @Body() dto: DeleteDocumentsDto) {
    try {
      return await this.googleDriveService.removeDocuments(user.id, id ?? null, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in destroyDocuments', error)
      throw new InternalServerErrorException()
    }
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync Google Drive documents' })
  async saveDocumentsSync(@CurrentUser() user: CurrentUserPayload, @Body() dto: SyncDocumentsDto) {
    try {
      return await this.googleDriveService.storeDocumentsSync(user.id, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveDocumentsSync', error)
      throw new InternalServerErrorException()
    }
  }
}
