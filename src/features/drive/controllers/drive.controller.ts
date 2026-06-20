import { Body, Controller, Delete, Get, HttpException, InternalServerErrorException, Logger, Post, Query, Res } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import type { Response } from 'express'
import { DriveService } from '../services/drive.service'
import type { SelectDriveFolderDto } from '../dto/drive.dto'

@ApiTags('drive')
@Controller('drive')
export class DriveController {
  private readonly logger = new Logger(DriveController.name)

  constructor(private readonly driveService: DriveService) {}

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
}
