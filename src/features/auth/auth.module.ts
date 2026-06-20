import { Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { SharedModule } from '../../shared/shared.module'
import { AuthController } from './controllers/auth.controller'
import { AuthService } from './services/auth.service'
import { AuthRepository } from './repositories/auth.repository'
import { JwtStrategy } from './strategies/jwt.strategy'

@Module({
  imports: [
    SharedModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, JwtStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
