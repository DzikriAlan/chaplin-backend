import { ThrottlerModuleOptions } from '@nestjs/throttler'

export const throttlerConfig: ThrottlerModuleOptions = {
  throttlers: [
    {
      name: 'default',
      ttl: 60000,
      limit: 100,
    },
    {
      name: 'ai',
      ttl: 60000,
      limit: 20,
    },
  ],
}
