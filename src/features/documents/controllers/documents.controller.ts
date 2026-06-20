import { Body, Controller, Delete, Get, HttpException, InternalServerErrorException, Logger, Patch, Post, Query } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { DocumentsService } from '../services/documents.service'
import type { UpdateDocumentsDto, DeleteDocumentsDto, SyncDocumentsDto } from '../dto/documents.dto'

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name)

  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
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

  @Patch()
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

  @Delete()
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
