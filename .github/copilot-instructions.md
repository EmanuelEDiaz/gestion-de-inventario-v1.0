# Copilot Instructions — Inventario Offline-First

This document guides Copilot sessions for the offline-first inventory management system. For comprehensive project rules and architecture decisions, refer to **[CLAUDE.md](../CLAUDE.md)** and **[AGENTS.md](../AGENTS.md)**.

## Quick Commands

### Frontend (Next.js 16 + React 19 + TypeScript 5)
```bash
cd frontend

# Development & Testing
pnpm dev                          # Dev server @ http://localhost:3000
pnpm build                        # Production build
pnpm lint                         # ESLint full suite
pnpm lint --fix                   # Auto-fix lint errors
pnpm test                         # Watch mode (Vitest)
pnpm test:run                     # Run tests once
pnpm test:coverage               # Coverage report

# Single test file
pnpm vitest run src/core/entities/product.test.ts
```

### Backend (Spring Boot 3.4 + WebFlux + Java 21)
```bash
cd backend/inventory-app

# Running
./mvnw spring-boot:run            # Server @ http://localhost:8080
./mvnw clean package              # Build JAR

# Testing
./mvnw test                       # Full test suite
./mvnw test -Dtest=ProductControllerTest  # Single test class
./mvnw test -Dtest=ProductControllerTest#testGetProduct  # Single method

# Code quality
./mvnw checkstyle:check          # Static analysis (if configured)
./mvnw spotbugs:check            # Bug detection (if configured)
```

### Docker Compose (All services)
```bash
docker compose up -d              # Start all containers
docker compose down               # Stop all containers
docker compose logs -f            # View logs (Ctrl+C to exit)
```

## High-Level Architecture

### Monorepo Structure

```
backend/
  inventory-app/               # Spring Boot application
    src/main/java/com/inventory/
      bootstrap/              # Application startup (@SpringBootApplication)
      config/                 # Spring configurations (WebFlux, R2DBC, Security, etc.)
      domain/                 # Domain model (PURO — NO Spring, NO DB, NO JSON)
        model/               # Entidades (Product, Warehouse, StockMovement, etc.)
        valueobject/         # Value objects (Money, Quantity, etc.)
        ports/
          in/                # Port interfaces for use cases (Query, Command handlers)
          out/               # Repository ports (database contracts)
        services/            # Domain services (ProductCostingService, etc.)
        events/              # Domain events (ProductCreated, etc.)
        errors/              # Custom domain exceptions
      application/            # Application layer (orchestration, DTOs, use cases)
        usecase/
          command/           # Create, Update, Delete use cases
          query/             # Read operations
        dto/                 # Application DTOs (request/response)
        mapper/              # MapStruct mappers (domain ↔ app DTO)
        service/             # Application services implementing ports
      adapters/               # External integrations
        web/                 # WebFlux REST controllers
          controller/        # @RestController endpoints
          dto/               # Web DTOs (may differ from app DTOs)
          mapper/            # Web ↔ App DTO mapping
        persistence/         # R2DBC repositories
          entity/            # JPA-like R2DBC entities
          repository/        # Spring Data R2DBC repositories
          mapper/            # Entity ↔ Domain mapping
        security/            # JWT auth, RBAC
    src/main/resources/
      db/migration/          # Flyway migrations (V1__init.sql, V2__..., etc.)
      application.yml        # Spring configuration
    src/test/java/           # JUnit 5 + Reactor Test + ArchUnit tests

frontend/
  src/
    app/                      # Next.js App Router (file-based routing)
      (public)/              # Public routes (no auth required)
      (auth)/                # Authentication routes
      (admin)/               # Admin panel routes
      (pos)/                 # Point-of-Sale routes
      (reports)/             # Reports routes
      (settings)/            # Settings routes
      /api/                  # BFF (Backend for Frontend) route handlers
    core/                     # Domain layer (TypeScript — NO React, NO HTTP)
      entities/              # Interfaces/types for domain objects
      interfaces/            # Port interfaces (repository contracts)
      use-cases/             # Business logic (pure functions or classes)
    infrastructure/           # Adapters (HTTP, IndexedDB, Service Worker)
      api/                   # Axios API clients
      repositories/          # Implementations of core/interfaces ports
      storage/               # IndexedDB (idb) + localStorage wrappers
      mappers/               # DTO → Entity transformations
    presentation/             # UI layer (React components)
      shared/
        components/ui/       # shadcn/ui base components
        hooks/               # Global hooks (useAuth, useOnlineStatus, etc.)
        lib/                 # Utils, constants, configs
      modules/               # Feature modules (each domain area)
        [module-name]/
          components/        # Module-specific components
          hooks/             # Module-specific hooks (controllers/adapters)
          views/             # Page compositions
    /tests/                   # Standalone test fixtures

docs/
  contracts/
    database-schema.md       # ERD, table definitions, indices, constraints
    endpoints.md             # OpenAPI 3 HTTP contract (all endpoints, auth, pagination)
    dtos.md                  # Request/Response DTOs with examples
    ports-interfaces.md      # Use cases and repository port definitions
    image-handling.md        # Image upload/download/thumbnail strategy
  design/
    offline-strategy.md      # Sync algorithm, outbox pattern, conflict resolution
    glossary.md              # Domain term definitions
    implementation-roadmap.md # Phase-by-phase implementation plan
  adr/
    architecture-decisions.md # Architecture Decision Records

infra/
  caddy/                      # Reverse proxy config (HTTPS local)
  docker/                     # Docker build contexts (if separate from root)

docker-compose.yml            # All services (PostgreSQL, backend, frontend, Caddy)
```

### Architecture Pattern: Clean + Hexagonal (Ports & Adapters)

**Backend dependency flow:**
```
domain (pure logic) ← application (use cases) ← adapters (REST, R2DBC, Security)
```

**Frontend dependency flow:**
```
core (pure entities, use-cases) ← infrastructure (API clients, IndexedDB) ← presentation (React UI)
```

**Critical rule:** `domain` and `core` are technology-agnostic. They contain no Spring, React, HTTP, JSON serialization, or database-specific code.

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Spring Boot 3.4, WebFlux (reactive), Java 21 LTS |
| **Database** | PostgreSQL 17 + R2DBC (runtime) + Flyway (migrations) |
| **Authentication** | JWT HS256 (access: 15min, refresh: 7d), bcrypt cost 12 |
| **Frontend** | Next.js 16, React 19, TypeScript 5, App Router |
| **State Management** | TanStack Query (server) + Zustand (UI state) |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Forms** | React Hook Form (optional, for complex forms) |
| **Icons** | @iconify/react or @material-symbols-svg/react |
| **Offline** | IndexedDB (idb) + Service Worker (next-pwa) |
| **Reverse Proxy** | Caddy 2 (HTTPS local, auto-signed CA for mobile PWA) |
| **Mappers** | MapStruct (backend), manual TypeScript (frontend) |
| **Code Quality** | ESLint (frontend), ArchUnit (backend, auto-enforced dependency rules) |

## Key Conventions

### Language & UI
- **UI visible text:** Spanish (labels, buttons, error messages, tooltips)
- **Code:** English (variables, functions, classes, comments)
- **Tooltips mandatory:** Every input, button, label, icon must have `title` attribute in Spanish

### TypeScript/Frontend
- **File naming:** kebab-case for files (`product-repository.ts`, `use-product.ts`), PascalCase for components (`ProductTable.tsx`)
- **Path alias:** `@/*` resolves to `./src/*`
- **Config:** `tsconfig.json` with `strict: true`, `target: ES2017`, `moduleResolution: "bundler"`
- **No `any`:** Only with explicit justification
- **Component size:** Max ~100 lines; break into smaller components
- **Hook size:** Max ~150 lines; extract logic into separate hooks or services
- **Prohibited patterns:**
  - ❌ `console.log()` in production code
  - ❌ `catch(e) {}` without typing
  - ❌ React state for server data (use TanStack Query instead)
  - ❌ Redux (use Zustand)

### Java/Spring Backend
- **File naming:** `ProductRepository.java` (PascalCase)
- **Dependency injection:** Constructor injection only, use records for immutable DTOs
- **Exceptions:** Extend custom `DomainException` for domain errors, respond with `application/problem+json`
- **R2DBC:** No blocking calls, all reactive (Mono/Flux)
- **Flyway migrations:** Use JDBC (not R2DBC), versioned as `V1__init.sql`, `V2__add_column.sql`, etc.
- **Repository ports:** Defined in `domain/ports/out`, implementations in `adapters/persistence`
- **Use cases:** One use case per class, in `application/usecase/{command,query}`

### Testing
- **Frontend:** Vitest + React Testing Library, test files co-located with source (`*.test.ts`, `*.spec.ts`)
- **Backend:** JUnit 5 + Reactor Test + Spring Boot Test, tests in `src/test/java`
- **Pattern:** AAA (Arrange, Act, Assert)
- **Code quality gates:** ArchUnit active in CI to enforce layer boundaries

### Offline & Sync
- **Strategy:** Outbox pattern — writes go to local outbox, async sync to server
- **Idempotency:** 72-hour TTL on idempotency keys
- **Sync cursor:** `sync_log.id` (bigserial) for pull queries
- **Conflict resolution:** Last-write-wins with user notification
- **Service Worker:** next-pwa handles registration; manual sync every 30s or on network change

### Security & Auth
- **JWT secret:** Minimum 32 characters, stored in environment (never committed)
- **Access token:** HS256, 15-minute expiration
- **Refresh token:** UUID-based, 7-day expiration
- **Password hash:** bcrypt cost 12
- **RBAC roles:** ADMIN (full access), MANAGER (operations + catalog), SELLER (sales + stock queries)
- **Middleware:** JWT validation required for all protected endpoints
- **Auditing:** Every write logs actor, timestamp, before/after JSON

### Database & Migrations
- **Migrations:** Flyway + JDBC (startup/CI), not R2DBC
- **Schema:** Defined in `docs/contracts/database-schema.md`
- **Naming:** Snake_case for tables/columns, ISO 8601 for timestamps (UTC)
- **Constraints:** Foreign keys, unique constraints, check constraints enforced at DB level
- **Indices:** Strategic indices for query performance (documented in schema)

### No Internet in Runtime
- ❌ No CDNs (Bootstrap, Material-UI from CDN, etc.)
- ❌ No remote font servers (Google Fonts, etc.)
- ❌ No external trackers, analytics, ads
- ❌ No remote API calls (all requests go to local backend via BFF)
- ✅ Assets served locally from `/public` (fonts, icons, images, etc.)

### Import Order (Frontend & Backend)
1. External libraries
2. Core domain / business logic
3. Interfaces / ports
4. Infrastructure adapters
5. Presentation / UI components

## Important Files & References

| File | Purpose |
|------|---------|
| [CLAUDE.md](../CLAUDE.md) | **Authoritative** project rules, architecture decisions, gates (Definition of Done) |
| [AGENTS.md](../AGENTS.md) | Skills required for Copilot, tech stack summary, key commands |
| [docs/contracts/database-schema.md](../docs/contracts/database-schema.md) | ERD and table definitions |
| [docs/contracts/endpoints.md](../docs/contracts/endpoints.md) | Full API contract (OpenAPI 3) |
| [docs/design/offline-strategy.md](../docs/design/offline-strategy.md) | Sync & offline implementation details |
| [docs/adr/architecture-decisions.md](../docs/adr/architecture-decisions.md) | Architecture Decision Records |
| `.env.example` | Environment variables template |

## Common Tasks

### Adding a New Feature

1. **Design first:** Update contracts (OpenAPI, database schema, DTOs) in `docs/contracts/`
2. **Backend:**
   - Add domain model in `domain/model/`
   - Define port in `domain/ports/out/` (repository contract)
   - Create use case in `application/usecase/{command,query}/`
   - Implement repository in `adapters/persistence/`
   - Add REST controller in `adapters/web/controller/`
   - Add Flyway migration if DB schema changes
3. **Frontend:**
   - Define core entity in `core/entities/`
   - Implement repository in `infrastructure/repositories/`
   - Create API client in `infrastructure/api/`
   - Build components in `presentation/modules/[feature]/`
   - Add tests co-located with source

### Running Tests Before Commit

```bash
# Frontend
cd frontend && pnpm lint --fix && pnpm test:run

# Backend
cd backend/inventory-app && ./mvnw clean test
```

### Database Migration

```bash
# Create empty migration
cd backend/inventory-app/src/main/resources/db/migration
touch V{N}__description.sql  # e.g., V3__add_index_on_products.sql

# Edit migration SQL, then backend auto-runs on startup
```

### Local HTTPS Testing (Mobile)

```bash
# Export CA certificate from Caddy
docker compose exec caddy cat /data/caddy/pki/authorities/local/root.crt > caddy_ca.crt

# Android: Settings → Security → Install certificate → CA certificate (select caddy_ca.crt)
# iOS: Settings → General → VPN and Device Management → Certificates, then trust
```

## CI/CD Gates

- ✅ **Lint & Format:** ESLint (frontend), Checkstyle (backend)
- ✅ **Unit & Integration Tests:** `pnpm test:run` (frontend), `./mvnw test` (backend)
- ✅ **Architecture Rules:** ArchUnit enforces layer boundaries (backend)
- ✅ **Build:** `pnpm build` (frontend), `./mvnw clean package` (backend)
- ✅ **E2E Tests:** Playwright (if configured) tests critical user workflows

Blocking issues fail the build — no merges without passing gates.

## Version Requirements

- Java 21 LTS (Eclipse Temurin)
- Spring Boot 3.4+
- Next.js 16+ (App Router)
- Node.js 20+ LTS
- PostgreSQL 16+
- pnpm 9+ (not npm)

---

**Last updated:** May 2026  
**For detailed rules, see:** [CLAUDE.md](../CLAUDE.md) and [AGENTS.md](../AGENTS.md)
