import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator'

export class UpdateDocumentsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  id?: string

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ids?: string[]

  @ApiProperty({ enum: ['skip', 'retry'] })
  @IsString()
  action: string
}

export class DeleteDocumentsDto {
  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ids?: string[]

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  all?: boolean
}

export class SyncDocumentsDto {
  @ApiPropertyOptional({ enum: ['list', 'pause', 'resume', 'process-all'] })
  @IsString()
  @IsOptional()
  action?: string
}

export class DocumentsResponseDto {
  @ApiProperty() id: string
  @ApiProperty() title: string
  @ApiProperty() mimeType: string
  @ApiProperty() driveId: string
  @ApiProperty() status: string
  @ApiProperty() createdAt: Date
  @ApiProperty() updatedAt: Date
}
