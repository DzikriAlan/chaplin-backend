import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getUserByEmailOrCreate(email: string, name?: string) {
    return this.prisma.user.upsert({
      where: { email },
      create: { email, name: name ?? email.split('@')[0] },
      update: {},
    })
  }
}
