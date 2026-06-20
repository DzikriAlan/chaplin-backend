import { ApiProperty } from '@nestjs/swagger'

export class DashboardResponseDto {
  @ApiProperty() documentCount: number
  @ApiProperty() chunkCount: number
  @ApiProperty() chatCount: number
  @ApiProperty() questionCount: number
  @ApiProperty() knowledgeCount: number
}
