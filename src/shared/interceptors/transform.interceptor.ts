import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { map } from 'rxjs/operators'
import { PaginatedResult } from '../utils/paginated-result'

interface SuccessResponse {
  success: boolean
  code: number
  message: string
  data: unknown
  meta: Record<string, unknown>
}

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler) {
    const requestId = randomUUID()
    const httpResponse = ctx.switchToHttp().getResponse<{ statusCode: number }>()

    return next.handle().pipe(
      map((raw): SuccessResponse => {
        const code = httpResponse.statusCode ?? 200
        const timestamp = new Date().toISOString()

        if (raw instanceof PaginatedResult) {
          const page = Math.floor(raw.offset / raw.limit) + 1
          const totalPages = Math.ceil(raw.total / raw.limit)
          return {
            success: true,
            code,
            message: 'Success',
            data: raw.data,
            meta: {
              page,
              limit: raw.limit,
              total: raw.total,
              total_pages: totalPages,
              timestamp,
              request_id: requestId,
            },
          }
        }

        return {
          success: true,
          code,
          message: 'Success',
          data: raw ?? null,
          meta: {
            timestamp,
            request_id: requestId,
          },
        }
      }),
    )
  }
}
