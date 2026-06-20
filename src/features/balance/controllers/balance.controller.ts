import { Body, Controller, Get, HttpException, InternalServerErrorException, Logger, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard'
import { CurrentUser, type CurrentUserPayload } from '../../../shared/decorators/current-user.decorator'
import { BalanceService } from '../services/balance.service'
import type { CreateBalanceDto } from '../dto/balance.dto'

@ApiTags('balance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('balance')
export class BalanceController {
  private readonly logger = new Logger(BalanceController.name)

  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  @ApiOperation({ summary: 'Get user balance' })
  async fetchBalance(@CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.balanceService.getBalance(user.id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchBalance', error)
      throw new InternalServerErrorException()
    }
  }

  @Post()
  @ApiOperation({ summary: 'Top-up balance' })
  async saveBalance(@Body() dto: CreateBalanceDto, @CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.balanceService.storeBalance(user.id, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveBalance', error)
      throw new InternalServerErrorException()
    }
  }
}
