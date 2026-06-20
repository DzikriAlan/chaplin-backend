import { Controller, Get, HttpException, InternalServerErrorException, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { DashboardService } from '../services/dashboard.service'

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name)

  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard stats' })
  async fetchDashboard() {
    try {
      return await this.dashboardService.getDashboard()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchDashboard', error)
      throw new InternalServerErrorException()
    }
  }
}
