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
import { AiChatModule } from './features/ai-chat/ai-chat.module'
import { DocumentsModule } from './features/documents/documents.module'
import { DriveModule } from './features/drive/drive.module'
import { KnowledgeBaseModule } from './features/knowledge-base/knowledgeBase.module'
import { FaqManagerModule } from './features/faq-manager/faq-manager.module'
import { QuestionsModule } from './features/questions/questions.module'
import { UploadModule } from './features/upload/upload.module'
import { BalanceModule } from './features/balance/balance.module'
import { UsageModule } from './features/usage/usage.module'
import { DashboardModule } from './features/dashboard/dashboard.module'

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
    AiChatModule,
    DocumentsModule,
    DriveModule,
    KnowledgeBaseModule,
    FaqManagerModule,
    QuestionsModule,
    UploadModule,
    BalanceModule,
    UsageModule,
    DashboardModule,
  ],
})
export class AppModule {}
