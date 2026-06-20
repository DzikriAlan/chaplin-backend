# NestJS Architecture Starter

## Architecture Overview

```txt
src/features/{folder-name}/
├── dto/{filename}.dto.ts
├── entities/{filename}.entity.ts
├── repositories/{filename}.repository.ts
├── services/{filename}.service.ts
└── controllers/{filename}.controller.ts
```

> repository, service, dan controller hanya boleh berhubungan dengan domain resource masing-masing. Jangan mendefinisikan hal lain di luar itu.

---

## Tech Stack

| Concern | Package |
|---|---|
| **Framework** | NestJS 10.x |
| **Language** | TypeScript |
| **ORM** | Prisma (PostgreSQL) |
| **Validation** | `class-validator` + `class-transformer` |
| **Auth** | `@nestjs/passport` + `passport-jwt` |
| **Config** | `@nestjs/config` |
| **Caching** | `@nestjs/cache-manager` + `ioredis` |
| **Rate Limiting** | `@nestjs/throttler` |
| **Queue** | `bullmq` + `@nestjs/bullmq` |
| **Testing** | Jest + `@nestjs/testing` |
| **Docs** | `@nestjs/swagger` |

---

## Shared Directory

```txt
src/shared/
├── prisma/
│   └── prisma.service.ts              # PrismaClient singleton
├── guards/
│   ├── jwt-auth.guard.ts              # JWT auth guard
│   └── ai-throttler.guard.ts          # rate-limit guard for AI endpoints
├── decorators/
│   └── current-user.decorator.ts
├── filters/
│   └── http-exception.filter.ts       # global exception filter → standard error response
├── interceptors/
│   └── transform.interceptor.ts       # global response wrapper → standard success response
├── queues/
│   ├── queue.constants.ts             # queue + job name constants
│   ├── queue.module.ts                # BullMQ module (embedding + drive-sync queues)
│   ├── queue.service.ts               # enqueue helpers used by feature services
│   ├── embedding.processor.ts         # processes FAQ + KB embedding jobs
│   └── drive-sync.processor.ts        # processes drive document sync jobs
├── throttler/
│   └── throttler.config.ts            # ThrottlerModule configuration
├── services/
│   ├── ai.service.ts                  # DeepSeek client + Jina embeddings + text chunking
│   ├── supabase.service.ts            # Supabase Storage client
│   ├── drive-processor.service.ts     # Google Drive OAuth + document processing
│   ├── redis.service.ts               # ioredis client wrapper (get/set/del/pub-sub/hset)
│   └── cache.service.ts               # caching + session + job status + ephemeral storage
└── utils/
    ├── utils.ts                       # bcrypt helpers
    └── paginated-result.ts            # PaginatedResult<T> shape for pagination meta
```

### `prisma.service.ts` — Singleton Wajib

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect()
  }
}
```

### `transform.interceptor.ts` — Response Wrapper Global

```typescript
// See API Response Standard section for full format.
// TransformInterceptor wraps responses as:
// { success, code, message, data, meta: { timestamp, request_id } }
// Paginated responses add: meta.page, meta.limit, meta.total, meta.total_pages
```

---

## API Response Standard

Semua response API **wajib** menggunakan format standar internasional berikut. Format ini diterapkan secara otomatis oleh `TransformInterceptor` (success) dan `HttpExceptionFilter` (error).

### Success Response — Single Object / Action

```json
{
  "success": true,
  "code": 200,
  "message": "Success",
  "data": { "id": "1", "name": "John Doe" },
  "meta": {
    "timestamp": "2026-06-20T12:00:00Z",
    "request_id": "b8f6b5d8-ec4f-4f1e-8e4e-8b92b1a0d8a"
  }
}
```

### Success Response — Paginated List

Service **wajib** mengembalikan `PaginatedResult<T>` dari `src/shared/utils/paginated-result.ts` agar interceptor dapat menghasilkan meta pagination:

```typescript
// usage.service.ts
return new PaginatedResult(logs, total, limit, offset)
```

```json
{
  "success": true,
  "code": 200,
  "message": "Success",
  "data": [{ "id": 1, "name": "John Doe" }],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "total_pages": 10,
    "timestamp": "2026-06-20T12:00:00Z",
    "request_id": "b8f6b5d8-ec4f-4f1e-8e4e-8b92b1a0d8a"
  }
}
```

### Error Response — Validation (400)

```json
{
  "success": false,
  "code": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Email is required" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ],
  "meta": {
    "timestamp": "2026-06-20T12:00:00Z",
    "request_id": "b8f6b5d8-ec4f-4f1e-8e4e-8b92b1a0d8a"
  }
}
```

### Error Response — General (4xx / 5xx)

```json
{
  "success": false,
  "code": 500,
  "message": "Internal server error",
  "data": null,
  "meta": {
    "timestamp": "2026-06-20T12:00:00Z",
    "request_id": "b8f6b5d8-ec4f-4f1e-8e4e-8b92b1a0d8a"
  }
}
```

### Aturan Response

| Kondisi | Field wajib |
|---|---|
| Success biasa | `success`, `code`, `message`, `data`, `meta.timestamp`, `meta.request_id` |
| Paginated list | Tambah `meta.page`, `meta.limit`, `meta.total`, `meta.total_pages` |
| Error validasi | Ganti `data` dengan `errors[]` (array `{ field, message }`) |
| Error umum | `success: false`, `code`, `message`, `data: null`, `meta` |

> **SSE endpoints** (`saveChat`, `saveAiChat`) menggunakan `@Res()` dan **dibebaskan** dari format ini karena menulis stream langsung ke response.

---

## Redis Architecture

Redis digunakan untuk 5 concern terpisah. Semua akses Redis melalui `RedisService` dan `CacheService` di `src/shared/services/`.

### 1. Caching — Hasil yang sering diakses

```typescript
// Di service, inject CacheService
async getAgentsList() {
  return this.cacheService.getOrSet(
    'agents:list',
    () => this.agentsRepository.findAgentsMany(),
    this.cacheService.ttl.AGENTS, // 300s
  )
}

// Invalidate cache setelah mutasi
async storeAgents(dto: CreateAgentsDto) {
  const result = await this.agentsRepository.createAgents(dto)
  await this.cacheService.invalidate('agents:list')
  return result
}
```

| Resource | Cache Key | TTL |
|---|---|---|
| Agents list | `agents:list` | 5 menit |
| Knowledge Base list | `knowledge-base:list` | 10 menit |
| Questions list | `questions:list` | 30 menit |
| Dashboard stats | `dashboard:stats` | 1 menit |
| Documents list | `documents:list` | 1 menit |

### 2. Session/State — Konteks percakapan sementara

```typescript
// Simpan konteks chat session (TTL 1 jam)
await this.cacheService.storeSessionContext(sessionId, { lastMessages: [...] })

// Ambil konteks
const ctx = await this.cacheService.getSessionContext<SessionCtx>(sessionId)
```

### 3. Rate Limiting — Membatasi request

`ThrottlerModule` dikonfigurasi dengan dua throttler:

| Name | Limit | Window | Digunakan untuk |
|---|---|---|---|
| `default` | 100 req | 60 detik | Semua endpoint |
| `ai` | 20 req | 60 detik | `/chat` POST, `/ai-chat` POST |

```typescript
// Di AI controller:
@Throttle({ default: { limit: 20, ttl: 60000 } })
@Post()
async saveChat(...) {}
```

### 4. Queue / Pub-Sub — Pemrosesan async

BullMQ digunakan untuk operasi berat yang tidak harus blocking:

| Queue | Job | Trigger | Action |
|---|---|---|---|
| `embedding` | `faq-embed` | POST /faq-manager | Generate + save embedding |
| `embedding` | `kb-embed` | POST /knowledge-base | Generate + save embedding |
| `drive-sync` | `process-document` | POST /documents/sync | Proses satu dokumen Drive |
| `drive-sync` | `run-cron-tick` | Cron interval | Sync semua dokumen Drive |

```typescript
// Di service, inject QueueService
async storeFaqManager(userId: string, dto: CreateFaqManagerDto) {
  const item = await this.faqManagerRepository.createFaqManager(userId, dto)
  await this.queueService.enqueueFaqEmbed(item.id, dto.question, dto.answer) // non-blocking
  return item
}
```

### 5. Ephemeral Storage — Data sementara

```typescript
// Token, metadata job, status sementara
await this.cacheService.storeJobStatus('drive-sync-xyz', { status: 'running', progress: 0 })
await this.cacheService.storeEphemeral('upload-metadata:abc', { size: 1024 }, 3600)
```

### Env Variables Redis

```
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
```

> Redis bersifat **opsional saat development**. Semua operasi Redis gagal secara graceful (try/catch) sehingga aplikasi tetap berjalan meski Redis tidak tersedia.

---

## Error Handling — Try-Catch Pattern

Setiap layer menangkap error sesuai tanggung jawabnya. Pattern ini memastikan raw Prisma errors tidak bocor ke client dan semua error memiliki HTTP status yang tepat.

### Repository Layer

Repository menangkap Prisma errors dan menerjemahkannya ke HTTP exception via `handlePrismaError()` dari `src/shared/utils/prisma-error.handler.ts`:

```typescript
import { handlePrismaError } from '../../../shared/utils/prisma-error.handler'

@Injectable()
export class AgentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAgentsMany() {
    try {
      return await this.prisma.agent.findMany()
    } catch (error) {
      throw handlePrismaError(error, 'agents')
    }
  }

  async deleteAgents(id: string) {
    try {
      return await this.prisma.agent.delete({ where: { id } })
    } catch (error) {
      throw handlePrismaError(error, 'agents')
    }
  }
}
```

| Prisma Code | HTTP Exception | Kondisi |
|---|---|---|
| `P2025` | `404 Not Found` | Record tidak ditemukan (findUnique, update, delete) |
| `P2002` | `409 Conflict` | Unique constraint violation |
| Others | `500 Internal Server Error` | Error database lainnya |

### Service Layer

Service membiarkan `HttpException` dari repository menerus langsung. Error non-HTTP dilog dan dilempar sebagai `InternalServerErrorException`:

```typescript
import { HttpException, InternalServerErrorException, Injectable, Logger } from '@nestjs/common'

@Injectable()
export class AgentsService {
  private readonly logger = new Logger(AgentsService.name)

  async getAgentsList() {
    try {
      return await this.agentsRepository.findAgentsMany()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to get agents list', error)
      throw new InternalServerErrorException('Failed to get agents list')
    }
  }

  async removeAgents(id: string) {
    try {
      await this.agentsRepository.deleteAgents(id)
      return { success: true }
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Failed to remove agent', error)
      throw new InternalServerErrorException('Failed to remove agent')
    }
  }
}
```

> **⚠️ Dilarang** menangkap `HttpException` dari repository dan mengubahnya ke exception lain (misal: catch dan rethrow sebagai `NotFoundException` baru). Biarkan exception dari repository menerus langsung.

### Controller Layer

Controller menambahkan logging kontekstual untuk error yang tidak terduga:

```typescript
import { HttpException, InternalServerErrorException, Controller, Logger } from '@nestjs/common'

@Controller('agents')
export class AgentsController {
  private readonly logger = new Logger(AgentsController.name)

  @Get()
  async fetchAgentsList() {
    try {
      return await this.agentsService.getAgentsList()
    } catch (error) {
      if (error instanceof HttpException) throw error
      this.logger.error('Unexpected error in fetchAgentsList', error)
      throw new InternalServerErrorException()
    }
  }
}
```

---

## Cross-Feature Sharing

Ketika dua feature atau lebih membutuhkan logic yang sama, ikuti aturan berikut:

```txt
src/shared/
└── services/
    └── {shared-resource}.service.ts   # shared service
```

Ketentuan:
- Service yang dikonsumsi oleh > 1 feature **wajib dipindahkan** ke `src/shared/services/`.
- Feature tidak boleh saling mengimpor service satu sama lain secara langsung.
- Shared service tetap didaftarkan via `SharedModule` dan di-export.

```typescript
// src/shared/shared.module.ts
import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'

@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class SharedModule {}
```

---

## Function Naming Rules

| Prefix | Repository | Service | Controller | Utilisasi (private method) |
|---|:---:|:---:|:---:|:---:|
| `find` | ✅ | ❌ | ❌ | ✅ |
| `create` | ✅ | ❌ | ❌ | ✅ |
| `update` | ✅ | ❌ | ❌ | ✅ |
| `delete` | ✅ | ❌ | ❌ | ✅ |
| `get` | ❌ | ✅ | ❌ | ✅ |
| `store` | ❌ | ✅ | ❌ | ✅ |
| `change` | ❌ | ✅ | ❌ | ✅ |
| `remove` | ❌ | ✅ | ❌ | ✅ |
| `fetch` | ❌ | ❌ | ✅ | ❌ |
| `save` | ❌ | ❌ | ✅ | ❌ |
| `modify` | ❌ | ❌ | ✅ | ❌ |
| `destroy` | ❌ | ❌ | ✅ | ❌ |

---

## Penamaan Folder & File

Dari URL endpoint, buang segmen berikut:
- Base URL / domain
- Prefix `api`
- Versioning: segmen yang cocok pola `v{angka}` (contoh: `v1`, `v2`)

Sisa path yang bermakna dibagi menjadi tiga konsep:

| Konsep | Aturan | Digunakan untuk |
|---|---|---|
| **folder-name** | Segmen **pertama** sisa path, `kebab-case` | Nama folder domain |
| **filename** | `folder-name` dikonversi ke `camelCase` | Prefix nama file `.ts` |
| **ResourceName** | Gabungan semua segmen, digabung `PascalCase` | Nama TypeScript: DTO, Entity, Service, dll |

**Contoh:**

| URL | folder-name | filename | ResourceName |
|---|---|---|---|
| `/api/v1/users/profile` | `users` | `users` | `UsersProfile` |
| `/api/v1/ai-search/register/file/{type}/{id}` | `ai-search` | `aiSearch` | `AiSearchRegisterFile` |

> Segmen dinamis (`{param}`) selalu diabaikan.

---

## Aturan Per File

### DTO (`{filename}.dto.ts`)

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsOptional, MinLength } from 'class-validator'

// Request body / query — hanya untuk POST, PUT, PATCH, GET (query)
export class Create{ResourceName}Dto {
  @ApiProperty()
  @IsString()
  field: string
}

export class Update{ResourceName}Dto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  field?: string
}

// Response shape — selalu ada
export class {ResourceName}ResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  field: string

  @ApiProperty()
  createdAt: Date
}
```

**Aturan DTO:**

| Kondisi | Buat DTO? |
|---|---|
| POST body | ✅ `Create{ResourceName}Dto` |
| PUT/PATCH body | ✅ `Update{ResourceName}Dto` |
| GET query params | ✅ `Query{ResourceName}Dto` |
| Response shape | ✅ `{ResourceName}ResponseDto` |
| DELETE (no body) | ❌ Tidak perlu DTO |

---

### Entity (`{filename}.entity.ts`)

Merefleksikan Prisma model. Hanya berisi tipe — tidak ada logic.

```typescript
export class {ResourceName}Entity {
  id: string
  field: string
  createdAt: Date
  updatedAt: Date
}
```

> Entity **tidak boleh** mengandung method atau business logic. Hanya shape dari data Prisma.

---

### Repository (`{filename}.repository.ts`)

Semua query Prisma **harus** berada di repository. Service tidak boleh memanggil Prisma langsung.

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/prisma/prisma.service'
import type { Create{ResourceName}Dto, Update{ResourceName}Dto } from '../dto/{filename}.dto'

@Injectable()
export class {FileName}Repository {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ prefix find — untuk READ
  async find{ResourceName}ById(id: string) {
    return this.prisma.{resource}.findUnique({ where: { id } })
  }

  async find{ResourceName}Many(query: Query{ResourceName}Dto) {
    return this.prisma.{resource}.findMany({
      where: { field: query.field },
    })
  }

  // ✅ prefix create — untuk INSERT
  async create{ResourceName}(dto: Create{ResourceName}Dto) {
    return this.prisma.{resource}.create({ data: dto })
  }

  // ✅ prefix update — untuk UPDATE
  async update{ResourceName}(id: string, dto: Update{ResourceName}Dto) {
    return this.prisma.{resource}.update({ where: { id }, data: dto })
  }

  // ✅ prefix delete — untuk DELETE
  async delete{ResourceName}(id: string) {
    return this.prisma.{resource}.delete({ where: { id } })
  }
}
```

**Aturan**: Hanya Prisma query. Tidak ada business logic, tidak ada HTTP concern.

---

### Service (`{filename}.service.ts`)

Business logic murni. Memanggil repository, bukan Prisma langsung.

```typescript
import { Injectable, NotFoundException } from '@nestjs/common'
import { {FileName}Repository } from '../repositories/{filename}.repository'
import type { Create{ResourceName}Dto, Update{ResourceName}Dto } from '../dto/{filename}.dto'

@Injectable()
export class {FileName}Service {
  constructor(private readonly {fileNameCamel}Repository: {FileName}Repository) {}

  // ✅ prefix get — untuk READ
  async get{ResourceName}(id: string) {
    const data = await this.{fileNameCamel}Repository.find{ResourceName}ById(id)
    if (!data) throw new NotFoundException('{ResourceName} not found')
    return data
  }

  async get{ResourceName}List(query: Query{ResourceName}Dto) {
    return this.{fileNameCamel}Repository.find{ResourceName}Many(query)
  }

  // ✅ prefix store — untuk CREATE
  async store{ResourceName}(dto: Create{ResourceName}Dto) {
    return this.{fileNameCamel}Repository.create{ResourceName}(dto)
  }

  // ✅ prefix change — untuk UPDATE
  async change{ResourceName}(id: string, dto: Update{ResourceName}Dto) {
    await this.get{ResourceName}(id) // guard: pastikan exists
    return this.{fileNameCamel}Repository.update{ResourceName}(id, dto)
  }

  // ✅ prefix remove — untuk DELETE
  async remove{ResourceName}(id: string) {
    await this.get{ResourceName}(id) // guard: pastikan exists
    return this.{fileNameCamel}Repository.delete{ResourceName}(id)
  }
}
```

**Aturan**: Tidak ada Prisma langsung. Tidak ada `req`/`res` HTTP concern. Hanya business logic.

---

### Controller (`{filename}.controller.ts`)

HTTP layer murni. Hanya routing, validasi request masuk, dan delegasi ke service.

```typescript
import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard'
import { {FileName}Service } from '../services/{filename}.service'
import type {
  Create{ResourceName}Dto,
  Update{ResourceName}Dto,
  Query{ResourceName}Dto,
} from '../dto/{filename}.dto'

@ApiTags('{folder-name}')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('{folder-name}')
export class {FileName}Controller {
  constructor(private readonly {fileNameCamel}Service: {FileName}Service) {}

  // ✅ prefix fetch — untuk GET
  @Get()
  @ApiOperation({ summary: 'Get {ResourceName} list' })
  async fetch{ResourceName}List(@Query() query: Query{ResourceName}Dto) {
    return this.{fileNameCamel}Service.get{ResourceName}List(query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get {ResourceName} by id' })
  async fetch{ResourceName}(@Param('id') id: string) {
    return this.{fileNameCamel}Service.get{ResourceName}(id)
  }

  // ✅ prefix save — untuk POST
  @Post()
  @ApiOperation({ summary: 'Create {ResourceName}' })
  async save{ResourceName}(@Body() dto: Create{ResourceName}Dto) {
    return this.{fileNameCamel}Service.store{ResourceName}(dto)
  }

  // ✅ prefix modify — untuk PATCH/PUT
  @Patch(':id')
  @ApiOperation({ summary: 'Update {ResourceName}' })
  async modify{ResourceName}(
    @Param('id') id: string,
    @Body() dto: Update{ResourceName}Dto,
  ) {
    return this.{fileNameCamel}Service.change{ResourceName}(id, dto)
  }

  // ✅ prefix destroy — untuk DELETE
  @Delete(':id')
  @ApiOperation({ summary: 'Delete {ResourceName}' })
  async destroy{ResourceName}(@Param('id') id: string) {
    return this.{fileNameCamel}Service.remove{ResourceName}(id)
  }
}
```

**Prefix method controller:**

| HTTP | Prefix | Contoh |
|---|---|---|
| GET | `fetch` | `fetchUsersProfile()` |
| POST | `save` | `saveRegisterFile()` |
| PUT/PATCH | `modify` | `modifyUsersProfile()` |
| DELETE | `destroy` | `destroyUsersProfile()` |

---

### Module (`{filename}.module.ts`)

```typescript
import { Module } from '@nestjs/common'
import { SharedModule } from '../../shared/shared.module'
import { {FileName}Controller } from './controllers/{filename}.controller'
import { {FileName}Service } from './services/{filename}.service'
import { {FileName}Repository } from './repositories/{filename}.repository'

@Module({
  imports: [SharedModule],
  controllers: [{FileName}Controller],
  providers: [{FileName}Service, {FileName}Repository],
  exports: [{FileName}Service], // export hanya jika digunakan feature lain
})
export class {FileName}Module {}
```

---

## Testing Guide

### Struktur Test

```txt
src/features/{folder-name}/
├── services/{filename}.service.spec.ts
├── repositories/{filename}.repository.spec.ts
└── controllers/{filename}.controller.spec.ts
```

### Service Test

```typescript
import { Test } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { {FileName}Service } from './{filename}.service'
import { {FileName}Repository } from '../repositories/{filename}.repository'

describe('{FileName}Service', () => {
  let service: {FileName}Service
  const mockRepository = {
    find{ResourceName}ById: jest.fn(),
    create{ResourceName}: jest.fn(),
    update{ResourceName}: jest.fn(),
    delete{ResourceName}: jest.fn(),
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        {FileName}Service,
        { provide: {FileName}Repository, useValue: mockRepository },
      ],
    }).compile()

    service = module.get({FileName}Service)
  })

  it('get{ResourceName} throws NotFoundException when not found', async () => {
    mockRepository.find{ResourceName}ById.mockResolvedValue(null)
    await expect(service.get{ResourceName}('nonexistent-id')).rejects.toThrow(NotFoundException)
  })

  it('store{ResourceName} creates and returns data', async () => {
    const dto = { field: 'value' }
    const result = { id: '1', ...dto }
    mockRepository.create{ResourceName}.mockResolvedValue(result)
    expect(await service.store{ResourceName}(dto)).toEqual(result)
  })
})
```

### Repository Test

```typescript
import { Test } from '@nestjs/testing'
import { {FileName}Repository } from './{filename}.repository'
import { PrismaService } from '../../shared/prisma/prisma.service'

describe('{FileName}Repository', () => {
  let repository: {FileName}Repository
  const mockPrisma = {
    {resource}: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        {FileName}Repository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    repository = module.get({FileName}Repository)
  })

  it('find{ResourceName}ById calls prisma.findUnique with correct id', async () => {
    mockPrisma.{resource}.findUnique.mockResolvedValue({ id: '1' })
    await repository.find{ResourceName}ById('1')
    expect(mockPrisma.{resource}.findUnique).toHaveBeenCalledWith({ where: { id: '1' } })
  })
})
```

### Controller E2E Test

```typescript
import { Test } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'

describe('{FileName}Controller (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      // import feature module dengan mock service
    }).compile()

    app = module.createNestApplication()
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    await app.init()
  })

  afterAll(() => app.close())

  it('GET /{folder-name} returns 200', () =>
    request(app.getHttpServer()).get('/{folder-name}').expect(200))

  it('POST /{folder-name} with invalid body returns 400', () =>
    request(app.getHttpServer())
      .post('/{folder-name}')
      .send({})
      .expect(400))
})
```

---

## Final Rules

- Tidak boleh merubah kode dan logika lain yang sudah ada.
- Tidak boleh ada penambahan atau perbaikan di luar kebutuhan task.
- Tidak boleh menggunakan penamaan function di luar convention yang sudah ditentukan.
- Harus melakukan utilisasi dengan membuat `private` method baru di dalam class yang sama.
- Private method utilitas tidak boleh berada di luar class-nya.
- Controller **tidak boleh** memanggil repository secara langsung.
- Service **tidak boleh** memanggil Prisma secara langsung.
- Repository **tidak boleh** mengandung business logic.

---

## Code Quality Rules (ESLint + SonarQube)

> **⚠️ WAJIB DIPATUHI. Setiap AI assistant yang bekerja di project ini HARUS mengikuti aturan ini tanpa terkecuali.**

### SonarQube Rules

- Cognitive Complexity maksimal **15** per method
- Method parameters maksimal **7**
- Hapus semua unused imports/variables
- Prefer `?.` daripada `&&` chain
- Dilarang `any` type — gunakan generics atau unknown
- Dilarang `console.log` di production code — gunakan NestJS `Logger`

### `package.json` — Dependency Wajib

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@nestjs/cache-manager": "^3.0.1",
    "@nestjs/throttler": "^6.4.0",
    "@nestjs/bullmq": "^10.3.0",
    "@prisma/client": "^5.0.0",
    "bullmq": "^5.51.1",
    "cache-manager": "^6.3.2",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "ioredis": "^5.3.2",
    "passport-jwt": "^4.0.1"
  },
  "devDependencies": {
    "@nestjs/testing": "^10.0.0",
    "@types/supertest": "^6.0.0",
    "jest": "^29.0.0",
    "supertest": "^6.3.0",
    "prisma": "^5.0.0"
  }
}
```

### `.eslintrc.js`

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off', // sesuai aturan service
    '@typescript-eslint/no-unused-vars': 'error',
    'no-console': 'error',
  },
}
```

### CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run lint
      - run: npx prisma generate
      - run: npm run test
      - run: npm run test:e2e
```

- Import order: NestJS core → Third-party → Shared → Internal (dto, entity, repository, service)
- Dilarang `// eslint-disable-next-line` kecuali unavoidable

---

## AI Assistant Memory Directive

> **SETIAP AI CODING ASSISTANT (Claude, Copilot, Cursor, Codeium, dll) YANG BEKERJA DI PROJECT INI WAJIB:**
> 1. Membaca dan memahami seluruh isi file ini sebelum menulis kode apapun.
> 2. Mematuhi semua aturan di atas.
> 3. Melakukan verifikasi `npm run lint` dan `npm run test` setelah setiap perubahan.
> 4. Project ini menggunakan **NestJS 10.x** dengan **Prisma** sebagai ORM utama.
> 5. Controller tidak boleh akses repository. Service tidak boleh akses Prisma langsung.
> 6. Semua Prisma query wajib berada di layer Repository.

---

## Skor Architecture

### Penilaian

| Aspek | Skor | Catatan |
|---|---|---|
| **Separation of Concerns** | 10/10 | 4 layer tegas: DTO → Entity → Repository → Service → Controller |
| **Naming Consistency** | 10/10 | Prefix table konsisten per layer, tidak ada ambiguitas |
| **Scalability** | 10/10 | SharedModule + shared/services; QueueModule untuk async; Module boundary jelas |
| **NestJS Idioms Fit** | 10/10 | Decorator-based, DI native, ValidationPipe, Swagger, ThrottlerModule terintegrasi |
| **Testability** | 10/10 | Unit test per layer + E2E test dengan supertest; mock pattern jelas |
| **Onboarding Clarity** | 10/10 | URL → folder/file mapping + prefix table per layer + response standard terdokumentasi |
| **DX (Developer Experience)** | 10/10 | package.json + eslint + CI pipeline (PostgreSQL + Redis) didefinisikan lengkap |
| **Code Quality Enforcement** | 10/10 | ESLint no-any + no-console + SonarQube complexity ≤15 + CI enforce otomatis |
| **API Response Standard** | 10/10 | Format internasional: `success/code/message/data/meta` + pagination + error `errors[]` |
| **Infrastructure (Redis)** | 10/10 | Caching + Session + Rate Limiting + Queue/Pub-Sub + Ephemeral storage via Redis |
| **Error Handling** | 10/10 | Try-catch 3-layer: Repository (Prisma → HTTP) → Service (log + rethrow) → Controller (context log) |

### Total Skor: **100 / 100**

### Kesimpulan

Architecture NestJS ini mempertahankan design philosophy yang sama dari frontend starter (layer separation, prefix naming per layer, cross-feature sharing via shared module) dan mengadaptasinya ke paradigma backend NestJS secara idiomatik. Empat layer yang tegas (Repository → Service → Controller + DTO/Entity) memastikan setiap concern berada di tempat yang tepat. API Response Standard internasional menjamin konsistensi format response di semua endpoint. Redis architecture mengelola caching, session, rate limiting, queue, dan ephemeral storage secara terstruktur melalui shared services. Error handling 3-layer memastikan raw Prisma errors tidak bocor ke client, dengan repository menerjemahkan database errors ke HTTP exceptions, service meneruskan HttpException dan melogger error non-HTTP, serta controller menambahkan logging kontekstual.