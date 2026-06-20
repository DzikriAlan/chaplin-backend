import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUsersById(id: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, image: true },
      })
    } catch (error) {
      throw handlePrismaError(error, 'user')
    }
  }
}
