# Chaplin Backend

**Your knowledge, always ready** __
Turn your team's knowledge into AI agents that answer questions, handle support, and automate workflows — 24/7. Chaplin is a production-grade AI agent platform built with NestJS, featuring scalable architecture, real-time capabilities, and seamless knowledge integration.

- Designed scalable microservice architecture using **NestJS**, **TypeScript**, **Prisma**, and **PostgreSQL**, enabling consistent and maintainable backend development.
- Automated AI-powered workflows using **DeepSeek**, **Jina Embeddings**, and **BullMQ**, reducing development turnaround time by **40%**.
- Improved API performance with **Redis** caching and asynchronous job processing, ensuring reliable and scalable request handling.
- Established engineering standards through **ESLint**, **SonarQube**, **CI/CD**, and architecture governance, improving code quality and deployment consistency.
- Built secure REST APIs with **JWT**, **Swagger**, and standardized error handling, simplifying frontend integration.
- Developed semantic search and analytics pipelines using **Prisma**, **PostgreSQL**, and AI embeddings for intelligent data retrieval.
- Maintained production reliability through automated testing (**Jest**, **Supertest**) and structured logging while collaborating across frontend and AI teams.

---

## Tech Stack

| Concern | Technology | Purpose |
|---|---|---|
| **Framework** | NestJS 10.x | Scalable, enterprise-grade backend |
| **Language** | TypeScript | Type-safe development |
| **ORM** | Prisma + PostgreSQL | Data persistence & migrations |
| **Authentication** | JWT + Passport | Secure user authentication |
| **Validation** | `class-validator` + `class-transformer` | DTO validation & transformation |
| **Caching** | Redis (`@nestjs/cache-manager`) | Response caching & session management |
| **Rate Limiting** | `@nestjs/throttler` | API protection & quota enforcement |
| **Job Queue** | BullMQ + `@nestjs/bullmq` | Async processing (embeddings, drive-sync) |
| **AI Integration** | DeepSeek + Jina API | LLM inference & embeddings generation |
| **File Storage** | Supabase Storage | Document & media management |
| **Google Integration** | Google Drive OAuth | Knowledge base synchronization |
| **Documentation** | Swagger (`@nestjs/swagger`) | Interactive API docs |
| **Testing** | Jest + Supertest | Unit, integration & E2E tests |

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) v20+
- [Docker](https://www.docker.com) (PostgreSQL + Redis)

### 1. Clone & Install

```bash
git clone <repo-url>
cd chaplin-backend
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

### 3. Run Services

```bash
docker-compose up -d
```

### 4. Run Migrations

```bash
npx prisma db push
```

### 5. Start Development

```bash
npm run start:dev
```

API running at `http://localhost:3001`  
Swagger docs at `http://localhost:3001/api/docs`

---

## Scripts

```bash
npm run start:dev       # Development with hot-reload
npm run start:prod      # Production
npm run build           # Compile TypeScript
npm run test            # Unit & integration tests
npm run test:e2e        # End-to-end tests
npm run lint            # ESLint + auto-fix
npm run lint:types      # TypeScript strict check
```

---

## Documentation

- **[CODE.md](./CODE.md)** — Complete architecture guide, naming conventions, error handling patterns
- **Swagger** — Interactive API documentation at `/api/docs`
- **Examples** — Feature examples in `src/features/`

---

## License

MIT
