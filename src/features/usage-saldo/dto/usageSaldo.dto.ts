import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsNumberString, IsOptional, Min } from 'class-validator'

// ─── Balance DTOs ────────────────────────────────────────────────────────────

export class CreateUsageSaldoTopupDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount: number
}

export class UsageSaldoBalanceResponseDto {
  @ApiProperty() id: string
  @ApiProperty() userId: string
  @ApiProperty() balance: number
  @ApiProperty() createdAt: Date
  @ApiProperty() updatedAt: Date
}

// ─── Usage DTOs ──────────────────────────────────────────────────────────────

export class QueryUsageSaldoLogsDto {
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

export class UsageSaldoLogsResponseDto {
  @ApiPropertyOptional() logs: unknown[]
  @ApiPropertyOptional() total: number
  @ApiPropertyOptional() limit: number
  @ApiPropertyOptional() offset: number
}
