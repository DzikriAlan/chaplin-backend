import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { Request, Response } from 'express'

interface ValidationError {
  field: string
  message: string
}

interface ErrorBody {
  message?: string | string[]
  error?: string
  statusCode?: number
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    const requestId = randomUUID()
    const timestamp = new Date().toISOString()

    this.logger.error(`${request.method} ${request.url} - ${status}: ${exception.message}`)

    const raw = exception.getResponse()
    const body: ErrorBody = typeof raw === 'object' ? (raw as ErrorBody) : { message: String(raw) }

    const isValidation = status === HttpStatus.BAD_REQUEST && Array.isArray(body.message)
    const errors: ValidationError[] = isValidation ? this.extractValidationErrors(body.message as string[]) : []

    const responseBody: Record<string, unknown> = {
      success: false,
      code: status,
      message: this.resolveMessage(body, status),
      meta: { timestamp, request_id: requestId },
    }

    if (isValidation && errors.length > 0) {
      responseBody['errors'] = errors
    } else {
      responseBody['data'] = null
    }

    response.status(status).json(responseBody)
  }

  private resolveMessage(body: ErrorBody, status: number): string {
    if (typeof body.message === 'string' && body.message) return body.message
    if (Array.isArray(body.message) && body.message.length > 0) return 'Validation failed'
    return HttpStatus[status] ?? 'An error occurred'
  }

  private extractValidationErrors(messages: string[]): ValidationError[] {
    return messages.map((msg) => {
      // "property size should not exist" → field: "size"
      // "fileName must be a string" → field: "fileName"
      const nonWhitelisted = /^property (\S+) should not exist/.exec(msg)
      const standard = /^(\S+) /.exec(msg)
      const field = nonWhitelisted?.[1] ?? standard?.[1] ?? 'unknown'
      return { field, message: msg }
    })
  }
}
