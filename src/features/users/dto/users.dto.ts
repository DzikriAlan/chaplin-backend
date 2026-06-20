import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class UsersResponseDto {
  @ApiProperty() id: string
  @ApiPropertyOptional() name?: string | null
  @ApiPropertyOptional() email?: string | null
  @ApiPropertyOptional() image?: string | null
}
