import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'

export interface SessionRow {
  sessionId: string
  lastMessage: string
  lastRole: string
  messageCount: number
  lastActivity: string
  title: string | null
}

interface CacheRow {
  answer: string
  sources: unknown
  score: number
}

interface DocRow {
  id: string
  content: string
  metadata: unknown
  score: number
}

interface FaqRow {
  question: string
  answer: string
  score: number
}

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findChatHistoryBySession(sessionId: string) {
    try {
      return await this.prisma.chatHistory.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' } })
    } catch (error) {
      throw handlePrismaError(error, 'chat')
    }
  }

  async createChatHistory(sessionId: string, role: string, content: string, sources?: unknown) {
    try {
      return await this.prisma.chatHistory.create({
        data: { sessionId, role, content, sources: sources as Parameters<typeof this.prisma.chatHistory.create>[0]['data']['sources'] },
      })
    } catch (error) {
      throw handlePrismaError(error, 'chat')
    }
  }

  async findChatSessions(): Promise<SessionRow[]> {
    try {
      return await this.prisma.$queryRaw<SessionRow[]>`
        WITH ranked AS (
          SELECT
            ch."sessionId",
            ch."content" AS "lastMessage",
            ch."role" AS "lastRole",
            COUNT(*) OVER (PARTITION BY ch."sessionId")::int AS "messageCount",
            ch."createdAt",
            ROW_NUMBER() OVER (PARTITION BY ch."sessionId" ORDER BY ch."createdAt" DESC) AS rn
          FROM "chat_history" ch
        ),
        latest AS (
          SELECT DISTINCT ON ("sessionId")
            "sessionId", "lastMessage", "lastRole", "messageCount", "createdAt" AS "lastActivity"
          FROM ranked WHERE rn = 1
          ORDER BY "sessionId", "createdAt" DESC
        )
        SELECT l."sessionId", l."lastMessage", l."lastRole", l."messageCount", l."lastActivity", cs."title"
        FROM latest l
        LEFT JOIN "chat_sessions" cs ON cs."sessionId" = l."sessionId"
        ORDER BY l."lastActivity" DESC
        LIMIT 20
      `
    } catch (error) {
      throw handlePrismaError(error, 'chat')
    }
  }

  async upsertChatSession(sessionId: string, title?: string) {
    try {
      return await this.prisma.chatSession.upsert({
        where: { sessionId },
        update: { title },
        create: { sessionId, title },
      })
    } catch (error) {
      throw handlePrismaError(error, 'chat')
    }
  }

  async deleteChatSession(sessionId: string) {
    try {
      await this.prisma.chatHistory.deleteMany({ where: { sessionId } })
      await this.prisma.chatSession.deleteMany({ where: { sessionId } })
    } catch (error) {
      throw handlePrismaError(error, 'chat')
    }
  }

  async findCacheExact(questionHash: string) {
    try {
      return await this.prisma.chatCache.findUnique({ where: { questionHash } })
    } catch (error) {
      throw handlePrismaError(error, 'chat')
    }
  }

  async findCacheSemantic(vectorStr: string): Promise<CacheRow[]> {
    try {
      return await this.prisma.$queryRaw<CacheRow[]>`
        SELECT answer, sources, (1 - (embedding <=> ${vectorStr}::vector(1024)))::float8 AS score
        FROM "chat_cache"
        WHERE "createdAt" > NOW() - INTERVAL '7 days' AND embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorStr}::vector(1024)
        LIMIT 1
      `
    } catch (error) {
      throw handlePrismaError(error, 'chat')
    }
  }

  async createChatCache(questionHash: string, question: string, answer: string, sources: unknown, vectorStr: string) {
    try {
      const item = await this.prisma.chatCache.create({
        data: { questionHash, question, answer, sources: sources as Parameters<typeof this.prisma.chatCache.create>[0]['data']['sources'] },
      })
      await this.prisma.$executeRaw`UPDATE "chat_cache" SET embedding = ${vectorStr}::vector(1024) WHERE id = ${item.id}`
    } catch (error) {
      throw handlePrismaError(error, 'chat')
    }
  }

  async findDocChunksByEmbedding(vectorStr: string, docIds?: string[]): Promise<DocRow[]> {
    try {
      const chunkLimit = 600
      if (docIds?.length) {
        return await this.prisma.$queryRaw<DocRow[]>`
          SELECT id, LEFT(content, ${chunkLimit}::integer) AS content, metadata,
                 (1 - (embedding <=> ${vectorStr}::vector(1024)))::float8 AS score
          FROM "document_chunks"
          WHERE embedding IS NOT NULL AND "documentId" = ANY(${docIds}::text[])
          ORDER BY embedding <=> ${vectorStr}::vector(1024)
          LIMIT 5
        `
      }
      return await this.prisma.$queryRaw<DocRow[]>`
        SELECT id, LEFT(content, ${chunkLimit}::integer) AS content, metadata,
               (1 - (embedding <=> ${vectorStr}::vector(1024)))::float8 AS score
        FROM "document_chunks"
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorStr}::vector(1024)
        LIMIT 5
      `
    } catch (error) {
      throw handlePrismaError(error, 'chat')
    }
  }

  async findKnowledgeBaseByEmbedding(vectorStr: string): Promise<FaqRow[]> {
    try {
      return await this.prisma.$queryRaw<FaqRow[]>`
        SELECT question, answer, (1 - (embedding <=> ${vectorStr}::vector(1024)))::float8 AS score
        FROM "knowledge_base"
        WHERE "isActive" = true AND embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorStr}::vector(1024)
        LIMIT 5
      `
    } catch (error) {
      throw handlePrismaError(error, 'knowledge-base')
    }
  }

  async findKnowledgeBaseByEmbeddingFiltered(vectorStr: string, kbIds: string[]): Promise<FaqRow[]> {
    try {
      return await this.prisma.$queryRaw<FaqRow[]>`
        SELECT question, answer, (1 - (embedding <=> ${vectorStr}::vector(1024)))::float8 AS score
        FROM "knowledge_base"
        WHERE "isActive" = true AND embedding IS NOT NULL AND id = ANY(${kbIds}::text[])
        ORDER BY embedding <=> ${vectorStr}::vector(1024)
        LIMIT 5
      `
    } catch (error) {
      throw handlePrismaError(error, 'knowledge-base')
    }
  }

  async findKnowledgeBaseFallback(): Promise<Array<{ question: string; answer: string }>> {
    try {
      return await this.prisma.$queryRaw`SELECT question, answer FROM "knowledge_base" WHERE "isActive" = true AND embedding IS NULL LIMIT 10`
    } catch (error) {
      throw handlePrismaError(error, 'knowledge-base')
    }
  }

  async findKnowledgeBaseFallbackFiltered(kbIds: string[]): Promise<Array<{ question: string; answer: string }>> {
    try {
      return await this.prisma.$queryRaw`SELECT question, answer FROM "knowledge_base" WHERE "isActive" = true AND embedding IS NULL AND id = ANY(${kbIds}::text[]) LIMIT 10`
    } catch (error) {
      throw handlePrismaError(error, 'knowledge-base')
    }
  }

  async findChatHistoryRecent(sessionId: string, take: number) {
    try {
      return await this.prisma.chatHistory.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' }, take })
    } catch (error) {
      throw handlePrismaError(error, 'chat')
    }
  }

  async findAgentById(agentId: string) {
    try {
      return await this.prisma.agent.findUnique({ where: { id: agentId } })
    } catch (error) {
      throw handlePrismaError(error, 'agent')
    }
  }
}
