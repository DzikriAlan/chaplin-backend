import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsInt, Min } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateUploadSignedUrlDto {
  @ApiProperty()
  @IsString()
  fileName: string

  @ApiProperty()
  @IsString()
  mimeType: string

  @ApiProperty()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  size: number

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  folderId?: string
}

export class CreateUploadFolderDto {
  @ApiProperty()
  @IsString()
  name: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  parentId?: string
}

export class UploadSignedUrlResponseDto {
  @ApiProperty() signedUrl: string
  @ApiProperty() token: string
  @ApiProperty() path: string
  @ApiProperty() fileId: string
}
