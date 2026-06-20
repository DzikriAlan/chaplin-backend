import { Module } from '@nestjs/common'
import { SharedModule } from '../../shared/shared.module'
import { AgentsController } from './controllers/agents.controller'
import { AgentsService } from './services/agents.service'
import { AgentsRepository } from './repositories/agents.repository'

@Module({
  imports: [SharedModule],
  controllers: [AgentsController],
  providers: [AgentsService, AgentsRepository],
})
export class AgentsModule {}
