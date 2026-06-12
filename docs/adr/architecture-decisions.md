# ADR-001: Clean Architecture + Hexagonal (Ports & Adapters)

- **Status**: Accepted
- **Date**: 2025-01-01
- **Context**: We need an architecture that allows the domain logic to remain independent of frameworks, databases, and transport mechanisms. The system must be testable, maintainable, and support multiple adapters (web, persistence, file storage).
- **Decision**: Adopt Clean Architecture with Hexagonal (Ports & Adapters) pattern combined with SOLID principles.
  - **Domain layer** (`domain/`): Pure Java — models, value objects, domain services, events, errors. No Spring annotations, no persistence annotations, no JSON annotations.
  - **Application layer** (`application/`): Use cases (commands & queries), DTOs, mappers. Depends only on domain. Orchestrates domain objects via ports.
  - **Adapters layer** (`adapters/`): Web (Spring WebFlux controllers), Persistence (R2DBC repositories), Security (JWT/RBAC), Storage (file system). Each adapter implements a port defined in domain/application.
  - **Dependency rule**: Dependencies point inward only (adapters → application → domain). Domain never depends on outer layers.
- **Consequences**:
  - Domain logic is framework-agnostic and highly testable.
  - Swapping adapters (e.g., different DB) requires no domain changes.
  - ArchUnit rules enforce dependency boundaries at CI time.

---

# ADR-002: Spring Boot WebFlux + R2DBC (Reactive)

- **Status**: Accepted
- **Date**: 2025-01-01
- **Context**: The system needs to handle concurrent POS operations, sync pushes, and file uploads efficiently. Traditional blocking I/O would limit throughput.
- **Decision**: Use Spring Boot WebFlux (reactive) with R2DBC for non-blocking database access on PostgreSQL.
  - Flyway migrations run via JDBC at startup (Flyway does not support R2DBC natively).
  - Runtime queries use R2DBC exclusively.
- **Consequences**:
  - All repository ports return `Mono<T>` / `Flux<T>`.
  - Blocking calls are forbidden in the reactive chain.
  - Flyway requires a separate JDBC datasource configured only for migrations.

---

# ADR-003: Offline-First with IndexedDB Outbox + Server-Authoritative Sync

- **Status**: Accepted
- **Date**: 2025-01-01
- **Context**: The app must work fully offline (LAN/hotspot, no internet). Sales, adjustments, and other operations created offline must sync reliably when connectivity returns.
- **Decision**:
  - Frontend stores operations in an IndexedDB outbox (Dexie.js v4+).
  - Sync uses push/pull pattern: `POST /api/v1/sync/push` (batch idempotent ops), `GET /api/v1/sync/pull?cursor=&limit=`.
  - Cursor is `bigserial` from `sync_log` table, monotonically increasing.
  - Each operation has a UUID `operation_id` for idempotency.
  - Conflict resolution: server-authoritative + optimistic locking (`version` field / `ETag` / `If-Match`).
  - Rejected operations are returned with reason and details.
- **Consequences**:
  - All mutable endpoints require `Idempotency-Key` header.
  - Frontend must handle rejected operations and surface conflicts to user.
  - Sync progress bar is mandatory in UI.

---

# ADR-004: JWT Authentication (HS256) + RBAC

- **Status**: Accepted
- **Date**: 2025-01-01
- **Context**: Need stateless authentication that works in offline/LAN scenarios without external auth providers.
- **Decision**:
  - Access token: JWT HS256, TTL 15 minutes.
  - Refresh token: UUID, hashed (SHA-256) in `refresh_tokens` table, TTL 7 days.
  - Refresh delivered via `httpOnly + Secure + SameSite=Strict` cookie.
  - RBAC v1: fixed roles `ADMIN`, `MANAGER`, `SELLER`.
  - Password hashing: bcrypt with cost factor 12.
- **Consequences**:
  - No external identity provider needed.
  - Token rotation on refresh.
  - Logout revokes refresh token server-side.

---

# ADR-005: File Storage on Disk (not in DB)

- **Status**: Accepted
- **Date**: 2025-01-01
- **Context**: Product images and user avatars need to be stored. Storing binary data in PostgreSQL (`bytea`) would bloat the database and complicate backups.
- **Decision**:
  - Images stored on filesystem under `INVENTORY_MEDIA_ROOT` (env variable).
  - DB stores only `file_path` (relative path under the root).
  - Paths are deterministic: `products/{productId}/original/{imageId}.{ext}`.
  - Thumbnails generated on upload (256px, 1024px for products; 256px for avatars).
  - Atomic writes: temp file + move.
  - Security: reject `..`, absolute paths, and path traversal.
- **Consequences**:
  - Docker volume mount for `/var/lib/inventory/media`.
  - Backup strategy must include media volume.
  - Images served via authenticated endpoints only.

---

# ADR-006: Caddy as Reverse Proxy for Local HTTPS

- **Status**: Accepted
- **Date**: 2025-01-01
- **Context**: PWA requires HTTPS. The app runs on LAN/hotspot without internet, so Let's Encrypt is not available.
- **Decision**: Use Caddy with auto-generated local CA certificates. Mobile devices trust the CA by installing it once.
- **Consequences**:
  - PWA features (Service Worker, install prompt) work on LAN.
  - One-time setup to trust CA on each device.

---

# ADR-007: Flyway for Database Migrations

- **Status**: Accepted
- **Date**: 2025-01-01
- **Context**: Need versioned, repeatable database migrations. R2DBC is runtime driver but Flyway requires JDBC.
- **Decision**: Use Flyway with a JDBC datasource configured only for migrations. Runs at application startup and in CI.
- **Consequences**:
  - Two datasource configs: JDBC (Flyway only) + R2DBC (runtime).
  - Migration files in `src/main/resources/db/migration/`.
  - Naming: `V{NNN}__{description}.sql`.

---

# ADR-008: MapStruct for Object Mapping

- **Status**: Accepted
- **Date**: 2025-01-01
- **Context**: Need compile-time-safe mapping between layers (Web DTO ↔ Application DTO ↔ Domain model ↔ Persistence entity).
- **Decision**: Use MapStruct for all inter-layer mappings. Unit tests validate critical field mappings.
- **Consequences**:
  - Compile-time error if mapping is incomplete.
  - No runtime reflection overhead.
  - Mapper interfaces in each layer's `mapper/` package.

---

## ADR-009: Migración de Dexie.js a idb

**Fecha**: 2026-06-04

**Contexto**: La versión inicial del proyecto usaba Dexie.js como wrapper de IndexedDB. La flexibilidad de Dexie.js para definir schemas dinámicos resultó en stores sin índices explícitos, dificultando consultas eficientes offline.

**Decisión**: Migrar a `idb` (v8+), un wrapper minimalista que expone la API nativa de IndexedDB con tipado estricto. Esto permite:
- Definir índices explícitos en el schema de upgrade
- Mejor rendimiento (Dexie.js agregaba overhead de observables)
- Bundle más pequeño (~3KB vs ~30KB de Dexie.js)
- Cero dependencias transitivas

**Consecuencias**:
- El código de DB migrations ahora es explícito (if/else vs version().stores())
- Los repositorios locales usan `db.transaction().store.put()` directo
- Se necesita un export `DB_VERSION` y `getDB()` centralizados

---

## ADR-010: Migración de Workbox a Serwist

**Fecha**: 2026-06-04

**Contexto**: Workbox era el Service Worker library inicial, pero requería configuración compleja para el precaching y routing offline.

**Decisión**: Migrar a Serwist, una librería SW moderna para Next.js que:
- Se integra nativamente con el build system de Next.js (turbopack)
- Soporta precaching declarativo y runtime caching
- `skipWaiting: false` para controlar la activación del SW
- `clientsClaim: true` para que el SW controle las pestañas existentes

**Consecuencias**:
- SW config vía `frontend/src/app/serwist/[path]/route.ts`
- Precaching de assets estáticos (JS, CSS, fonts, sprites)
- Offline fallback para navegación via `/~offline`
- Namespace de cache por userId para datos dinámicos

---

## ADR-011: Migración de Leaflet a MapLibre GL JS

**Fecha**: 2026-06-05

**Contexto**: La app usaba Leaflet con react-leaflet para mapas offline. Leaflet no soporta nativamente PMTiles (el formato estándar para tiles vectoriales offline), requiriendo plugins adicionales (leaflet.vectorgrid, pmtiles). El bundle resultante era comparable al de MapLibre pero con peor rendimiento de renderizado y APIs menos predecibles.

**Decisión**: Migrar a MapLibre GL JS porque:
- Soporte nativo de PMTiles vía `addProtocol()`
- Soporte de tiles vectoriales (mejor renderizado, más pequeño que PNG tiles)
- Sin dependencia de `react-leaflet` (MapLibre se usa directo, sin wrapper React)
- Mejor rendimiento de GPU vía WebGL
- Comunidad activa y compatible con protomaps basemaps

**Consecuencias**:
- Carga lazy via `next/dynamic({ ssr: false })` por ~500KB gzipped
- Protocolo `opfs-pmtiles://` para tiles desde OPFS
- Protocolo `pmtiles://` para tiles desde servidor
- Se eliminó Leaflet y sus dependencias (react-leaflet, leaflet.vectorgrid, @types/leaflet)
- Criterio de retiro: Leaflet se mantiene en git history, disponible como fallback

---

## ADR-012: CI con Caching Controlado de Turbopack

**Fecha**: 2026-06-11

**Contexto**: El build de frontend con Next.js + Turbopack genera ~970MB de cache en `.next/cache`. Sin cacheo en CI, cada build es desde cero (~3-5 min). Con cacheo sin control, el cache de GitHub Actions crece sin límite, consumiendo el límite de 10GB por repo.

**Decisión**: Implementar `actions/cache@v4` en `.github/workflows/ci.yml` con las siguientes medidas de control:
- **Key compuesta**: `next-cache-{lockfileHash}-{sourceHash}` — se invalida automáticamente cuando cambian dependencias O código fuente
- **Restore keys** con fallback progresivo: `next-cache-{lockfileHash}-` (reusa cache si solo cambia código) → `next-cache-` (fallback genérico si cambia lockfile)
- **Path restringido**: solo `frontend/.next/cache` (~970MB), no todo `.next/` (~3.4GB con dev artifacts)
- **Save-always**: No se forza guardado en fallos (comportamiento default de `actions/cache@v4`)
- **Pipeline**: install → lint → build → test

**Consecuencias**:
- Builds en CI se benefician del cache de Turbopack sin crecer sin control
- El límite de 10GB de GitHub Actions se maneja via LRU automático + cache keys precisas
- El CI requiere que `next build` + `pnpm test:run` pasen para ser válido

---

## ADR-013: Eliminación de Lockfiles Duplicados

**Fecha**: 2026-06-11

**Contexto**: Next.js Turbopack detectaba múltiples lockfiles al iniciar el dev server:
```
▲ [next-turbopack] [turbo_binding] You have the following duplicate lockfiles:
  pnpm-lock.yaml (raíz)
  frontend/pnpm-workspace.yaml
```
La raíz contenía un `pnpm-lock.yaml` de 55 líneas (artefacto de un `pnpm install` accidental anterior al `.gitignore`). Además, `frontend/pnpm-workspace.yaml` contenía solo `allowBuilds` sin definir workspaces, pero Turbopack lo clasificaba como lockfile por su nombre.

**Decisión**:
1. Eliminar `pnpm-lock.yaml` raíz del disco (ya estaba en `.gitignore` y no en HEAD)
2. Eliminar `frontend/pnpm-workspace.yaml` del disco y del tracking de git
3. Migrar su config `allowBuilds` a `frontend/package.json` como `pnpm.onlyBuiltDependencies`

**Consecuencias**:
- Turbopack detecta exactamente un lockfile (`frontend/pnpm-lock.yaml`) — sin warnings
- La seguridad de builds sigue activa via `onlyBuiltDependencies` en `package.json` (API moderna de pnpm, sin archivo workspace innecesario)
- El proyecto no es un monorepo; no necesita `pnpm-workspace.yaml`
