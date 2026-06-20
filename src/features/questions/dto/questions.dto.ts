import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class QueryQuestionsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  topic?: string
}

export class CreateQuestionsGenerateDto {
  @ApiProperty()
  @IsString()
  topic: string

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  @IsOptional()
  count?: number

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  type?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  gradeLevel?: string
}

export class QuestionsResponseDto {
  @ApiProperty() id: string
  @ApiProperty() topic: string
  @ApiProperty() type: string
  @ApiProperty() question: string
  @ApiPropertyOptional() options?: unknown
  @ApiProperty() answer: string
  @ApiPropertyOptional() discussion?: string | null
  @ApiProperty() createdAt: Date
}
