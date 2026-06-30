import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsNumber } from 'class-validator'

export class CreateUploadSignedUrlDto {
  @ApiProperty()
  @IsString()
  fileName: string

  @ApiProperty()
  @IsString()
  mimeType: string

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  size?: number

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  folderId?: string
}

export class CreateUploadFolderDto {
  @ApiProperty()
  @IsString()
  folderName: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string
}

export class MyDriveSignedUrlResponseDto {
  @ApiProperty() myDriveSignedUrl: string
  @ApiProperty() myDriveFileId: string
  @ApiProperty() myDriveExpiresIn: number
}

export class MyDriveFolderResponseDto {
  @ApiProperty() id: string
  @ApiProperty() userId: string
  @ApiProperty() myDriveFolderName: string
  @ApiProperty({ required: false }) myDriveDescription?: string
  @ApiProperty() createdAt: Date
  @ApiProperty() updatedAt: Date
}

export class MyDriveFileResponseDto {
  @ApiProperty() id: string
  @ApiProperty() myDriveFolderId: string
  @ApiProperty() myDriveFileName: string
  @ApiProperty() myDriveMimeType: string
  @ApiProperty() myDriveFileUrl: string
  @ApiProperty() myDriveSize: number
  @ApiProperty() createdAt: Date
  @ApiProperty() updatedAt: Date
}
