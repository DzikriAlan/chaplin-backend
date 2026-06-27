import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AuthRepository } from '../repositories/auth.repository'
import type { AuthLoginDto } from '../dto/auth.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  getCurrentUser(userId: string, email: string) {
    return { userId, email }
  }

  async storeAuthLogin(dto: AuthLoginDto) {
    const user = await this.authRepository.getUserByEmailOrCreate(dto.email, dto.name)
    const token = await this.jwtService.signAsync({ sub: user.id, email: user.email ?? dto.email })
    return { token }
  }
}
