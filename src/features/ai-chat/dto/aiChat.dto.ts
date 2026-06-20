import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional } from 'class-validator'

export class SaveAiChatDto {
  @ApiProperty()
  @IsString()
  message: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  senderName?: string
}

export class AiChatResponseDto {
  @ApiProperty()
  done: boolean

  @ApiProperty()
  balanceAfter: number

  @ApiProperty()
  deduction: number
}
