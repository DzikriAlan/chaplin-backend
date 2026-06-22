import { Body, Controller, Delete, Get, HttpException, InternalServerErrorException, Logger, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard'
import { CurrentUser, type CurrentUserPayload } from '../../../shared/decorators/current-user.decorator'
import { KnowledgeBaseMyDriveService } from '../services/knowledgeBaseMyDrive.service'
import type { CreateUploadSignedUrlDto, CreateUploadFolderDto } from '../dto/knowledgeBaseMyDrive.dto'

@ApiTags('knowledge-base/my-drive')
@Controller('knowledge-base/my-drive')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KnowledgeBaseMyDriveController {
  private readonly logger = new Logger(KnowledgeBaseMyDriveController.name)

  constructor(private readonly myDriveService: KnowledgeBaseMyDriveService) {}

  // ─── Signed URL ──────────────────────────────────────────────────────────────

  @Post('signed-url')
  @ApiOperation({ summary: 'Create signed upload URL' })
  async saveUploadSignedUrl(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateUploadSignedUrlDto) {
    try {
      return await this.myDriveService.storeUploadSignedUrl(user.id, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveUploadSignedUrl', error)
      throw new InternalServerErrorException()
    }
  }

  // ─── Files ───────────────────────────────────────────────────────────────────

  @Get('files')
  @ApiOperation({ summary: 'List uploaded files' })
  async fetchUploadFiles(@CurrentUser() user: CurrentUserPayload, @Query('folderId') folderId: string) {
    try {
      return await this.myDriveService.getUploadFilesList(user.id, folderId ?? null)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchUploadFiles', error)
      throw new InternalServerErrorException()
    }
  }

  @Delete('files')
  @ApiOperation({ summary: 'Delete uploaded file' })
  async destroyUploadFiles(@CurrentUser() user: CurrentUserPayload, @Query('id') id: string) {
    try {
      return await this.myDriveService.removeUploadFile(user.id, id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in destroyUploadFiles', error)
      throw new InternalServerErrorException()
    }
  }

  // ─── Folders ─────────────────────────────────────────────────────────────────

  @Get('folders')
  @ApiOperation({ summary: 'List upload folders' })
  async fetchUploadFolders(@CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.myDriveService.getUploadFoldersList(user.id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchUploadFolders', error)
      throw new InternalServerErrorException()
    }
  }

  @Post('folders')
  @ApiOperation({ summary: 'Create upload folder' })
  async saveUploadFolders(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateUploadFolderDto) {
    try {
      return await this.myDriveService.storeUploadFolder(user.id, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveUploadFolders', error)
      throw new InternalServerErrorException()
    }
  }

  @Delete('folders')
  @ApiOperation({ summary: 'Delete upload folder' })
  async destroyUploadFolders(@CurrentUser() user: CurrentUserPayload, @Query('id') id: string) {
    try {
      return await this.myDriveService.removeUploadFolder(user.id, id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in destroyUploadFolders', error)
      throw new InternalServerErrorException()
    }
  }
}
