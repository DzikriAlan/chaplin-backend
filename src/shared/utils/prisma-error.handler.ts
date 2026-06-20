import { ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'

export function handlePrismaError(error: unknown, resource: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') throw new NotFoundException(`${resource} not found`)
    if (error.code === 'P2002') throw new ConflictException(`${resource} already exists`)
    throw new InternalServerErrorException(`Database error (${error.code})`)
  }
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    throw new InternalServerErrorException('Unknown database error')
  }
  throw new InternalServerErrorException('Unexpected database error')
}
