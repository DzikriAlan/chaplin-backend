import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class ChatDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  message: string

  @ApiProperty()
  @IsString()
  sessionId: string

  @ApiProperty()
  @IsString()
  agentId: string
}
