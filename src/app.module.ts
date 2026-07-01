import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { SharedModule } from './shared/shared.module'
import { QueueModule } from './shared/queues/queue.module'
import { throttlerConfig } from './shared/throttler/throttler.config'
import { AuthModule } from './features/auth/auth.module'
import { UsersModule } from './features/users/users.module'
import { AgentsModule } from './features/agents/agents.module'
import { ChatModule } from './features/chat/chat.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot(throttlerConfig),
    SharedModule,
    QueueModule,
    AuthModule,
    UsersModule,
    AgentsModule,
    ChatModule,
  ],
})
export class AppModule {}
