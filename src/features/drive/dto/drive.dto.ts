import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional } from 'class-validator'

export class SelectDriveFolderDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  folderId?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  folderName?: string
}

export class DriveConfigResponseDto {
  id: string
  folderId: string
  folderName: string | null
  lastSyncAt: Date | null
}
