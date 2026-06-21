import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'

interface UsageFilter {
  userId: string
  limit: number
  offset: number
  month?: number | null
  year?: number | null
}

@Injectable()
export class UsageSaldoRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Balance Methods ─────────────────────────────────────────────────────────

  async findBalance(userId: string) {
    try {
      return await this.prisma.userBalance.findUnique({ where: { userId } })
    } catch (error) {
      throw handlePrismaError(error, 'balance')
    }
  }

  async createBalance(userId: string) {
    try {
      return await this.prisma.userBalance.create({ data: { userId } })
    } catch (error) {
      throw handlePrismaError(error, 'balance')
    }
  }

  async updateBalanceTopup(userId: string, balanceBefore: number, amount: number) {
    try {
      const balanceAfter = balanceBefore + amount
      const [updated] = await this.prisma.$transaction([
        this.prisma.userBalance.update({ where: { userId }, data: { balance: balanceAfter } }),
        this.prisma.usageLog.create({
          data: { userId, activityType: 'topup', deduction: -amount, balanceBefore, balanceAfter },
        }),
      ])
      return updated
    } catch (error) {
      throw handlePrismaError(error, 'balance')
    }
  }

  // ─── Usage Methods ───────────────────────────────────────────────────────────

  async findUsageLogs(filter: UsageFilter) {
    try {
      const dateFilter = this.buildDateFilter(filter.month, filter.year)
      const where = { userId: filter.userId, activityType: { in: ['chat', 'sync'] as string[] }, ...dateFilter }
      const [logs, total] = await Promise.all([
        this.prisma.usageLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: filter.limit, skip: filter.offset }),
        this.prisma.usageLog.count({ where }),
      ])
      return { logs, total }
    } catch (error) {
      throw handlePrismaError(error, 'usage')
    }
  }

  private buildDateFilter(month?: number | null, year?: number | null) {
    if (!month || !year) return {}
    return {
      createdAt: {
        gte: new Date(year, month - 1, 1),
        lte: new Date(year, month, 0, 23, 59, 59),
      },
    }
  }
}
