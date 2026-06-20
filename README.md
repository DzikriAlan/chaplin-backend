# NestJS Starter

Production-ready NestJS starter dengan arsitektur berlapis: Repository → Service → Controller, dilengkapi JWT auth, Prisma ORM, Swagger docs, dan test suite lengkap.

## Tech Stack

| Concern | Package |
|---|---|
| Framework | NestJS 10.x |
| Language | TypeScript |
| ORM | Prisma (PostgreSQL) |
| Auth | JWT (`@nestjs/passport` + `passport-jwt`) |
| Validation | `class-validator` + `class-transformer` |
| Docs | Swagger (`@nestjs/swagger`) |
| Testing | Jest + Supertest |

---

## Quick Start

### Prasyarat

- [Node.js](https://nodejs.org) v20+
- [Docker](https://www.docker.com) (untuk PostgreSQL lokal)

### 1. Clone & install

```bash
git clone <repo-url>
cd nest-starter
npm install
```

### 2. Setup environment

```bash
cp .env.example .env
```

File `.env` sudah siap dipakai untuk development lokal tanpa perlu diubah.

### 3. Jalankan database

```bash
docker-compose up -d
```

### 4. Jalankan migrasi database

```bash
npm run db:migrate
```

### 5. Jalankan aplikasi

```bash
npm run start:dev
```

Aplikasi berjalan di **http://localhost:3000**

| URL | Deskripsi |
|---|---|
| `http://localhost:3000/api/v1` | Base API |
| `http://localhost:3000/api/docs` | Swagger UI |

---

## Endpoints

### Auth (public)

| Method | URL | Deskripsi |
|---|---|---|
| POST | `/api/v1/auth/register` | Daftar akun baru |
| POST | `/api/v1/auth/login` | Login, mendapatkan JWT |
| GET | `/api/v1/auth/me` | Profil user yang sedang login |

### Users (JWT required)

| Method | URL | Deskripsi |
|---|---|---|
| GET | `/api/v1/users` | List semua user |
| GET | `/api/v1/users/:id` | Detail user |
| POST | `/api/v1/users` | Buat user baru |
| PATCH | `/api/v1/users/:id` | Update user |
| DELETE | `/api/v1/users/:id` | Hapus user |

---

## Scripts

```bash
npm run start:dev      # Development dengan hot-reload
npm run start:prod     # Production
npm run build          # Compile TypeScript
npm run test           # Unit & controller tests
npm run test:e2e       # E2E tests
npm run lint           # Lint & auto-fix
npm run db:migrate     # Jalankan migrasi Prisma
npm run db:push        # Push schema tanpa migrasi (prototyping)
npm run db:studio      # Buka Prisma Studio (GUI database)
```

---

## Struktur Project

```
src/
├── features/
│   ├── auth/                   # Authentication (login, register, me)
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── strategies/         # JWT Passport strategy
│   │   └── auth.module.ts
│   └── users/                  # User management CRUD
│       ├── controllers/
│       ├── dto/
│       ├── entities/
│       ├── repositories/
│       ├── services/
│       └── users.module.ts
└── shared/
    ├── prisma/                 # PrismaService singleton
    ├── guards/                 # JwtAuthGuard
    ├── decorators/             # @CurrentUser()
    ├── filters/                # HttpExceptionFilter
    ├── interceptors/           # TransformInterceptor (response wrapper)
    └── utils/                  # hashPassword, comparePassword, excludeFields
```

Lihat [CLAUDE.md](./CLAUDE.md) untuk panduan arsitektur lengkap dan konvensi penamaan.

---

## Menambah Feature Baru

Ikuti pola dari URL endpoint:

```
URL: /api/v1/products
  → folder-name : products
  → filename    : products
  → ResourceName: Products
```

Buat file berikut:

```
src/features/products/
├── dto/products.dto.ts
├── entities/products.entity.ts
├── repositories/products.repository.ts
├── services/products.service.ts
├── controllers/products.controller.ts
└── products.module.ts
```

Daftarkan module di [app.module.ts](src/app.module.ts):

```typescript
import { ProductsModule } from './features/products/products.module'

@Module({
  imports: [..., ProductsModule],
})
export class AppModule {}
```

---

## Response Format

Semua response dibungkus oleh `TransformInterceptor`:

```json
// Success
{ "status": "success", "data": { ... } }

// Error
{ "status": "error", "statusCode": 400, "message": "...", "timestamp": "...", "path": "..." }
```
