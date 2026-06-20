import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsArray } from 'class-validator'

export class SaveChatDto {
  @ApiProperty()
  @IsString()
  message: string

  @ApiProperty()
  @IsString()
  sessionId: string

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  docs?: string[]

  @ApiPropertyOptional()
  @IsOptional()
  files?: FilePayload[]

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  agentId?: string | null
}

export interface FilePayload {
  name: string
  type: string
  size: number
  base64: string
}

export class PatchChatSessionsDto {
  @ApiProperty()
  @IsString()
  sessionId: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string
}
