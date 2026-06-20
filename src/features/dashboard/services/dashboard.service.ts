import { HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { DashboardRepository } from '../repositories/dashboard.repository'
import { CacheService } from '../../../shared/services/cache.service'

const DASHBOARD_STATS_KEY = 'dashboard:stats'

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name)

  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly cacheService: CacheService,
  ) {}

  async getDashboard() {
    try {
      return await this.cacheService.getOrSet(
        DASHBOARD_STATS_KEY,
        () => this.dashboardRepository.findDashboardStats(),
        this.cacheService.ttl.DASHBOARD,
      )
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get dashboard', error)
      throw new InternalServerErrorException('Failed to get dashboard stats')
    }
  }
}
