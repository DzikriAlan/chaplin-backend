import { Controller, Get, HttpException, InternalServerErrorException, Logger, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard'
import { CurrentUser, type CurrentUserPayload } from '../../../shared/decorators/current-user.decorator'
import { UsageService } from '../services/usage.service'
import { QueryUsageDto } from '../dto/usage.dto'

@ApiTags('usage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('usage')
export class UsageController {
  private readonly logger = new Logger(UsageController.name)

  constructor(private readonly usageService: UsageService) {}

  @Get()
  @ApiOperation({ summary: 'Get usage logs' })
  async fetchUsageList(@Query() query: QueryUsageDto, @CurrentUser() user: CurrentUserPayload) {
    try {
      return await this.usageService.getUsageList(user.id, query)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchUsageList', error)
      throw new InternalServerErrorException()
    }
  }
}
