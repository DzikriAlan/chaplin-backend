import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, Min } from 'class-validator'

export class CreateBalanceDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount: number
}

export class BalanceResponseDto {
  @ApiProperty() id: string
  @ApiProperty() userId: string
  @ApiProperty() balance: number
  @ApiProperty() createdAt: Date
  @ApiProperty() updatedAt: Date
}
