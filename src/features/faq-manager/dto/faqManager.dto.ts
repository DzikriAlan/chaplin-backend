import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength } from 'class-validator'

export class CreateFaqManagerDto {
  @ApiProperty()
  @IsString()
  @MaxLength(250)
  question: string

  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  answer: string
}

export class FaqManagerResponseDto {
  @ApiProperty() id: string
  @ApiProperty() userId: string
  @ApiProperty() question: string
  @ApiProperty() answer: string
  @ApiProperty() isActive: boolean
  @ApiProperty() createdAt: Date
  @ApiProperty() updatedAt: Date
}
