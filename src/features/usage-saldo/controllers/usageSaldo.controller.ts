import { Body, Controller, Get, HttpException, InternalServerErrorException, Logger, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard'
import { CurrentUser, type CurrentUserPayload } from '../../../shared/decorators/current-user.decorator'
import { UsageSaldoService } from '../services/usageSaldo.service'
import type { CreateUsageSaldoTopupDto, QueryUsageSaldoLogsDto } from '../dto/usageSaldo.dto'

@ApiTags('usage-saldo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('usage-saldo')
export class UsageSaldoController {
  private readonly logger = new Logger(UsageSaldoController.name)

  constructor(private readonly usageSaldoService: UsageSaldoService) {}

  // ─── Balance Endpoints ───────────────────────────────────────────────────────

  @Get('balance')
  @ApiOperation({ summary: 'Get user balance' })
  async loadBalance(@CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.usageSaldoService.getBalance(user.id)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in loadBalance', error)
      throw new InternalServerErrorException()
    }
  }

  @Post('topup')
  @ApiOperation({ summary: 'Top up balance' })
  async saveTopup(@Body() dto: CreateUsageSaldoTopupDto, @CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.usageSaldoService.storeTopup(user.id, dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveTopup', error)
      throw new InternalServerErrorException()
    }
  }

  // ─── Usage Endpoints ─────────────────────────────────────────────────────────

  @Get('logs')
  @ApiOperation({ summary: 'Get usage logs' })
  async loadUsageLogs(@Query() query: QueryUsageSaldoLogsDto, @CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.usageSaldoService.getUsageLogs(user.id, query)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchUsageLogs', error)
      throw new InternalServerErrorException()
    }
  }
}
