import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString } from 'class-validator'

export class AuthMeResponseDto {
  @ApiProperty() userId: string
  @ApiProperty() email: string
}

export class AuthLoginDto {
  @ApiProperty()
  @IsEmail()
  email: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string
}

export class AuthTokenResponseDto {
  @ApiProperty() token: string
}
