import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, IsBoolean } from 'class-validator'

export class CreateAgentsDto {
  @ApiProperty()
  @IsString()
  name: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  personalization?: string

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean
}

export class UpdateAgentsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  image?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  personalization?: string

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean
}

export class AgentsResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  name: string

  @ApiPropertyOptional()
  description?: string | null

  @ApiPropertyOptional()
  image?: string | null

  @ApiPropertyOptional()
  personalization?: string | null

  @ApiProperty()
  isDefault: boolean

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date
}
