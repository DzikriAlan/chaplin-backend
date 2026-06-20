import { HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common'
import { UsersRepository } from '../repositories/users.repository'

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(private readonly usersRepository: UsersRepository) {}

  async getUsersMe(userId: string) {
    try {
      const user = await this.usersRepository.findUsersById(userId)
      if (!user) throw new NotFoundException('User not found')
      return user
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get users me', error)
      throw new InternalServerErrorException('Failed to get user')
    }
  }
}
