import { Body, Controller, Get, HttpException, InternalServerErrorException, Logger, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard'
import { CurrentUser, type CurrentUserPayload } from '../../../shared/decorators/current-user.decorator'
import { AuthService } from '../services/auth.service'
import { AuthLoginDto } from '../dto/auth.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user' })
  async loadAuthMe(@CurrentUser() user: CurrentUserPayload) {
    try {
      return this.authService.getCurrentUser(user.id, user.email)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in loadAuthMe', error)
      throw new InternalServerErrorException()
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and get JWT token' })
  async saveAuthLogin(@Body() dto: AuthLoginDto) {
    try {
      return await this.authService.storeAuthLogin(dto)
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in saveAuthLogin', error)
      throw new InternalServerErrorException()
    }
  }
}
