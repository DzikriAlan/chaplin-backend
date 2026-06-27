# Chaplin Backend

**Your knowledge, always ready**

Turn your team's knowledge into AI agents that answer questions, handle support, and automate workflows — 24/7. Chaplin is a production-grade AI agent platform built with NestJS, featuring scalable architecture, real-time capabilities, and seamless knowledge integration.

## What i do

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

- [Node.js](https://nodejs.org) v20+ (verify with `node --version`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (running and verified)
  - Verify: `docker --version` and `docker ps` (should not error)

### 1. Clone & Install

```bash
git clone <repo-url>
cd chaplin-backend
npm install
```

If installation fails:
```bash
npm ci
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Ensure `.env` contains (may already be in `.env.example`):

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chaplin"

# Auth
NEXTAUTH_SECRET="your-secret-key-here"

# API Keys (optional for dev)
DEEPSEEK_API_KEY=your-key
JINA_API_KEY=your-key
SUPABASE_URL=your-url
SUPABASE_KEY=your-key
```

### 3. Start Docker Services

```bash
docker-compose up -d
```

Wait for services to be ready (10-15 seconds):

```bash
# Check PostgreSQL is ready
docker-compose logs postgres | grep "database system is ready"

# Check Redis is ready (optional)
docker-compose logs redis | grep "Ready to accept connections"
```

If services don't start, see Troubleshooting below.

### 4. Run Database Migrations

```bash
npx prisma db push
```

Verify schema created:
```bash
npx prisma db seed  # if seed file exists (optional)
```

### 5. Start Development Server

```bash
npm run start:dev
```

API running at **http://localhost:3001**  
Swagger docs at **http://localhost:3001/api/docs**

Verify API is responding:
```bash
curl http://localhost:3001/api/v1/health
```

---

## Troubleshooting

### Docker daemon not running

**Error:** `Cannot connect to Docker daemon`

**Solution:**
```bash
# On macOS/Windows: Open Docker Desktop app
# On Linux: Start Docker service
sudo systemctl start docker
docker ps  # verify it works
```

### PostgreSQL not ready in time

**Error:** `connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Wait longer for database to start
sleep 10
npx prisma db push
```

Or check logs:
```bash
docker-compose logs postgres
```

### Port 5432 (PostgreSQL) already in use

**Error:** `bind: address already in use`

**Solution:**
```bash
# Find what's using port 5432
lsof -i :5432

# Option 1: Stop the conflicting service
kill -9 <PID>

# Option 2: Use different port in docker-compose.yml
# Change: ports: - "5432:5432" to "5433:5432"
# Then update DATABASE_URL in .env
```

### Port 6379 (Redis) already in use

**Error:** `bind: address already in use` on port 6379

**Solution:**
```bash
# Find what's using port 6379
lsof -i :6379

# Redis is optional for dev, can kill it
kill -9 <PID>

# Or use different port in docker-compose.yml
```

### .env.example missing or incomplete

**Error:** `cp .env.example .env` → file not found

**Solution:**
Create `.env` manually with the variables shown in "Setup Environment" above

### Prisma migration fails

**Error:** `Error: Unknown database` or `connection timeout`

**Solution:**
```bash
# Check database exists and is ready
docker-compose logs postgres

# Reset and recreate
npx prisma db push --skip-generate  # force it

# Or full reset
docker-compose down -v  # removes all data
docker-compose up -d
sleep 10
npx prisma db push
```

### API not responding

**Error:** `curl: (7) Failed to connect`

**Solution:**
```bash
# Check if service is running
docker-compose ps

# Check logs
npm run start:dev  # run in foreground to see errors

# Verify port 3001 is not in use
lsof -i :3001
```

### Module not found errors

**Error:** `Cannot find module`

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run start:dev
```

### TypeScript compilation errors

**Error:** `TS2307: Cannot find module`

**Solution:**
```bash
npm run build  # see full error details
npm run lint:types  # check type errors
```

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
