import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator'

export class SelectDriveFolderDto {
  @ApiProperty()
  @IsString()
  folderId: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  folderName?: string
}

export class UpdateDocumentsDto {
  @ApiProperty()
  @IsString()
  id: string

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

export class DeleteDocumentsDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ids?: string[]
}

export class SyncDocumentsDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fileIds?: string[]
}

export class DriveConfigResponseDto {
  @ApiProperty() id: string
  @ApiProperty() userId: string
  @ApiProperty() folderId: string
  @ApiProperty() folderName: string
  @ApiProperty() isActive: boolean
  @ApiProperty() createdAt: Date
  @ApiProperty() updatedAt: Date
}

export class GoogleDriveDocumentResponseDto {
  @ApiProperty() id: string
  @ApiProperty() googleDriveFileId: string
  @ApiProperty() googleDriveFileName: string
  @ApiProperty() googleDriveMimeType: string
  @ApiProperty() googleDriveIsActive: boolean
  @ApiProperty() createdAt: Date
  @ApiProperty() updatedAt: Date
}
