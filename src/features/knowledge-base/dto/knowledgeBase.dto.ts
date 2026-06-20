import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsArray } from 'class-validator'

export class CreateKnowledgeBaseDto {
  @ApiProperty()
  @IsString()
  question: string

  @ApiProperty()
  @IsString()
  answer: string

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]
}

export class UpdateKnowledgeBaseDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  question?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  answer?: string

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]
}

export class KnowledgeBaseResponseDto {
  @ApiProperty() id: string
  @ApiProperty() question: string
  @ApiProperty() answer: string
  @ApiProperty({ type: [String] }) tags: string[]
  @ApiProperty() isActive: boolean
  @ApiProperty() createdAt: Date
  @ApiProperty() updatedAt: Date
}
