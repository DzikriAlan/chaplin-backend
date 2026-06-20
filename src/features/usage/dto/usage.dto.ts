import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumberString, IsOptional } from 'class-validator'

export class QueryUsageDto {
  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  limit?: string

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  offset?: string

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  month?: string

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  year?: string
}

export class UsageResponseDto {
  @ApiPropertyOptional() logs: unknown[]
  @ApiPropertyOptional() total: number
  @ApiPropertyOptional() limit: number
  @ApiPropertyOptional() offset: number
}
