import { NestFactory } from '@nestjs/core'
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './shared/filters/http-exception.filter'
import { TransformInterceptor } from './shared/interceptors/transform.interceptor'

;(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this)
}

async function bootstrap() {
  const logger = new Logger('Bootstrap')
  const app = await NestFactory.create(AppModule)

  const configService = app.get(ConfigService)
  const port = configService.get<number>('PORT', 3001)

  app.setGlobalPrefix('api')
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  app.useGlobalFilters(new HttpExceptionFilter())
  app.useGlobalInterceptors(new TransformInterceptor())

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:4000'],
    credentials: true,
  })

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Chaplin Backend')
    .setDescription('Chaplin AI Backend API')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document)

  await app.listen(port)
  logger.log(`Application running on: http://localhost:${port}/api/v1`)
  logger.log(`Swagger docs: http://localhost:${port}/api/docs`)
}

bootstrap()
