# Copilot Instructions — Inventario Offline-First

This document guides Copilot sessions for the offline-first inventory management system. For comprehensive project rules and architecture decisions, refer to **[CLAUDE.md](../CLAUDE.md)** and **[AGENTS.md](../AGENTS.md)**.

## Quick Commands

### Development (One-Command Startup)
```bash
# Automated setup: Backend + Frontend in parallel
./start-dev.sh                    # Start both backend (:8080) and frontend (:3000)
./stop-dev.sh                     # Stop both services

# Auto-installs: Java 21, Maven, Node.js 22, pnpm
# Requires: PostgreSQL running on :5432 (or Docker)
```

### Frontend (Next.js 16 + React 19 + TypeScript 5)
```bash
cd frontend

# Development & Testing
pnpm dev                          # Dev server @ http://localhost:3000 (turbopack)
pnpm build                        # Production build
pnpm lint                         # ESLint full suite
pnpm lint --fix                   # Auto-fix lint errors
pnpm test                         # Watch mode (Vitest)
pnpm test:run                     # Run tests once (CI-safe)
pnpm test:coverage               # Coverage report

# Single test file
pnpm vitest run src/core/entities/product.test.ts

# E2E Testing (Playwright)
node ../e2e-tests.mjs            # Run e2e tests directly
npx playwright test               # Run tests from tests/
npx playwright test --headed      # Watch browser while testing
```

### Backend (Spring Boot 3.4 + WebFlux + Java 21)
```bash
cd backend/inventory-app

# Running
./mvnw spring-boot:run            # Server @ http://localhost:8080 (auto-runs Flyway migrations)
./mvnw clean package              # Build JAR

# Testing
./mvnw test                       # Full test suite (includes ArchUnit)
./mvnw test -Dtest=ProductControllerTest  # Single test class
./mvnw test -Dtest=ProductControllerTest#testGetProduct  # Single method
```

### Docker Compose (All services)
```bash
docker compose up -d              # Start: PostgreSQL → Backend → Frontend → Caddy
docker compose down               # Stop all containers
docker compose logs -f            # View logs (Ctrl+C to exit)
docker compose logs backend       # View specific service logs

# App URLs:
#   API:  http://localhost:8080/api/v1
#   App:  https://localhost (with auto-signed cert for PWA)
```

### Knowledge Graph (Graphify)
```bash
# For complex cross-file investigations, use graphify before grep:
graphify query "what uses the Product entity?" --budget 2000  # BFS context
graphify update .                  # Post-change (quick AST update)

# Results in graphify-out/ with god nodes and communities
```

## High-Level Architecture

### ⚠️ Critical: Next.js 16 Breaking Changes

**Before writing any frontend code:** Read `node_modules/next/dist/docs/` first. This version has significant breaking changes in APIs, conventions, and file structure. Check deprecation notices carefully.

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
- **Complete offline:** PWA cached + IndexedDB for data + outbox for pending writes

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
| [AGENTS.md](../AGENTS.md) | Copilot commands, tech stack summary, key rules for this project |
| [frontend/AGENTS.md](../frontend/AGENTS.md) | Next.js 16 warnings, native build approvals, frontend-specific rules |
| [docs/contracts/database-schema.md](../docs/contracts/database-schema.md) | ERD and table definitions |
| [docs/contracts/endpoints.md](../docs/contracts/endpoints.md) | Full API contract (OpenAPI 3) |
| [docs/contracts/dtos.md](../docs/contracts/dtos.md) | Request/Response DTOs with examples |
| [docs/design/offline-strategy.md](../docs/design/offline-strategy.md) | Sync & offline implementation details |
| [docs/adr/architecture-decisions.md](../docs/adr/architecture-decisions.md) | Architecture Decision Records |
| [.github/mcp-config.md](./mcp-config.md) | MCP server setup for Playwright and other tools |
| `.env.example` | Environment variables template |

## Critical Project Rules

### Architecture (Non-Negotiable)
- ✅ **Clean + Hexagonal:** domain → application → adapters
- ✅ **`domain` and `core` are pure:** NO Spring, React, HTTP, JSON, or DB-specific code
- ✅ **Dependency flow only inward:** Adapters depend on Application/Domain, never reverse
- ✅ **ArchUnit enforces this in CI:** Layer violations cause build failure

### Runtime (100% Offline)
- ❌ **NO CDNs:** Bootstrap, Material-UI, Google Fonts, etc. must be local
- ❌ **NO external trackers/analytics**
- ❌ **NO remote API calls** except to local backend (via BFF on frontend)
- ✅ **ALL assets** in `/public` (fonts, icons, static images)

### Conventions (Mandatory)
- **UI text:** Spanish (labels, buttons, tooltips, error messages)
- **Code:** English (variables, functions, classes, comments)
- **Tooltips required:** Every input, button, label must have `title` in Spanish
- **File naming frontend:** kebab-case files, PascalCase components
- **File naming backend:** PascalCase (ProductRepository.java)
- **No `console.log()`** in production code (frontend)
- **No `any` type** without explicit justification (frontend TypeScript)
- **Component size:** Max ~100 lines; split if larger
- **Hook size:** Max ~150 lines; extract if larger

### State Management (Strict Rules)
- ✅ **TanStack Query:** For server data (products, sales, stock)
- ✅ **Zustand:** For UI state (modals, filters, theme)
- ❌ **NO Redux**
- ❌ **NO React state for server data** (TanStack Query required)

### Database & Migrations
- **Tool:** Flyway (JDBC for migrations, R2DBC for runtime)
- **Naming:** Snake_case tables/columns, ISO 8601 UTC timestamps
- **Versioning:** V1__init.sql, V2__add_column.sql
- **Constraints enforced at DB level:** Foreign keys, unique, check constraints

## Common Tasks

### Before Making ANY Code Changes
1. **Check CLAUDE.md** for the Definition of Done (Gates)
2. **Check AGENTS.md** for current commands and rules
3. **For frontend:** Read Next.js 16 breaking changes in `node_modules/next/dist/docs/`

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
# Frontend (from root or frontend/)
pnpm lint --fix
pnpm test:run

# Backend (from backend/inventory-app/)
./mvnw clean test
```

### Creating a Database Migration

```bash
# 1. Create empty migration
cd backend/inventory-app/src/main/resources/db/migration
touch V{N}__description.sql  # e.g., V3__add_user_roles.sql

# 2. Edit migration (SQL only, Flyway handles JDBC)
# 3. Restart backend — Flyway auto-runs on startup
```

### Debugging Offline Sync Issues

Check these files in order:
1. `frontend/src/infrastructure/storage/outbox-service.ts` — Local outbox logic
2. `frontend/src/infrastructure/repositories/sync-repository.ts` — Push/pull logic
3. `backend/src/main/java/com/inventory/adapters/web/controller/SyncController.java` — Server sync endpoint
4. IndexedDB in DevTools: Application → IndexedDB → [database] → outbox

### Testing Offline Functionality

```bash
# 1. Start app normally (online mode)
pnpm dev

# 2. In browser DevTools:
#    - Network tab → Throttling: "Offline"
#    - Or: DevTools → Network → "Work offline"

# 3. Perform actions (create, update)

# 4. Go back online (DevTools → Throttling: "No throttling")

# 5. Verify sync in:
#    - Browser console (should log sync events)
#    - Network tab (should see POST to /api/v1/sync/push)
#    - Backend logs (should log inbound sync)
```

### Local HTTPS Testing (Mobile)

```bash
# 1. Export CA certificate from Caddy
docker compose exec caddy cat /data/caddy/pki/authorities/local/root.crt > caddy_ca.crt

# 2. Install on device:
#    Android: Settings → Security → Install certificate → CA certificate
#    iOS: Settings → General → VPN and Device Management → Certificates, then trust

# 3. Access via LAN IP:
#    Edit infra/caddy/Caddyfile: replace 'localhost' with server IP (e.g., 192.168.1.100)
#    Restart: docker compose restart caddy
#    Visit: https://192.168.1.100 on mobile device
```

## CI/CD Gates (Must Pass Before Merge)

- ✅ **Lint & Format:** ESLint (frontend), Checkstyle (backend)
- ✅ **Unit & Integration Tests:** `pnpm test:run` (frontend), `./mvnw test` (backend)
- ✅ **Architecture Rules:** ArchUnit enforces layer boundaries (backend violations = build failure)
- ✅ **Build:** `pnpm build` (frontend), `./mvnw clean package` (backend)
- ✅ **E2E Tests:** Playwright (if configured) tests critical user workflows
- ✅ **Offline Tests:** E2E includes offline sync, service worker, and PWA functionality

**Blocking issues fail the build — no merges without passing gates.**

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker compose logs backend

# Common: Flyway migration error
# Solution: Check db/migration/ SQL syntax and ensure migrations are incremental (V1, V2, V3...)

# Common: Port 5432 (PostgreSQL) not available
# Solution: docker run -d -p 5432:5432 postgres:17 or use existing DB
```

### Frontend build fails
```bash
# Clear cache and rebuild
rm -rf frontend/.next node_modules/.vite
cd frontend && pnpm install && pnpm build

# Check for Next.js 16 API usage
# Read: node_modules/next/dist/docs/
```

### Offline sync not working
1. Check browser IndexedDB in DevTools
2. Verify Service Worker registered: DevTools → Application → Service Workers
3. Check browser console for sync errors
4. Check backend logs: `docker compose logs backend | grep -i sync`

### E2E tests failing
```bash
# Run in headed mode to watch browser
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Check test file: frontend/e2e-tests.mjs
```

## Version Requirements

- Java 21 LTS (Eclipse Temurin)
- Spring Boot 3.4+
- Next.js 16+ (App Router) — **breaking changes, read docs**
- Node.js 20+ LTS
- PostgreSQL 16+
- pnpm 9+ (not npm)

---

**Last updated:** May 2026  
**For detailed rules and context:** [CLAUDE.md](../CLAUDE.md), [AGENTS.md](../AGENTS.md), [frontend/AGENTS.md](../frontend/AGENTS.md)  
**For architecture:** See [docs/adr/architecture-decisions.md](../docs/adr/architecture-decisions.md)
