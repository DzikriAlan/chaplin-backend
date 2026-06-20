import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'

@Injectable()
export class BalanceRepository {
  constructor(private readonly prisma: PrismaService) {}

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
}
