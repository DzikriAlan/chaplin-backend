import { Module } from '@nestjs/common'
import { SharedModule } from '../../shared/shared.module'
import { UsageSaldoController } from './controllers/usageSaldo.controller'
import { UsageSaldoService } from './services/usageSaldo.service'
import { UsageSaldoRepository } from './repositories/usageSaldo.repository'

@Module({
  imports: [SharedModule],
  controllers: [UsageSaldoController],
  providers: [UsageSaldoService, UsageSaldoRepository],
})
export class UsageSaldoModule {}
