import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, MinLength, IsOptional } from 'class-validator'

export class ChatDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  message: string

  @ApiProperty()
  @IsString()
  sessionId: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agentId?: string
}
