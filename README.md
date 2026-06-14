# Gestión de Inventario — Offline-First

Sistema de gestión de inventario offline-first con multi-almacén, POS, multi-moneda y mapas offline, diseñado para operar sin internet en LAN/hotspot.

## Stack

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui |
| Backend | Spring Boot 3.4 + WebFlux + Java 21 |
| Base de datos | PostgreSQL 17 + R2DBC (runtime) + Flyway (migraciones) |
| Offline | IndexedDB (idb) + OPFS + Serwist SW + TanStack Query + Zustand |
| Mapas | MapLibre GL JS + PMTiles |
| Proxy | Caddy 2 (HTTPS local auto-firmado) |

## Principios Offline-First (P1–P5)

| # | Principio | Implicación |
|---|-----------|-------------|
| P1 | **Zero internet en runtime** | Todos los assets, mapas, fuentes y datos están en local; cero CDNs ni APIs remotas |
| P2 | **Dispositivo ligero** | Sync progresivo, lazy load de mapas, recursos mínimos en CPU/RAM |
| P3 | **Offline indefinido** | La app funciona sin conexión por tiempo ilimitado; IndexedDB como fuente primaria |
| P4 | **El servidor puede apagarse** | Operaciones en outbox local; cuando el servidor vuelve, se sincronizan |
| P5 | **Sync no destructivo** | Server-authoritative con optimistic locking; conflictos se resuelven sin pérdida de datos |

## Arquitectura Hexagonal

```
Backend:   domain → application → adapters  (domain nunca importa Spring/DB)
Frontend:  core   → infrastructure → presentation (core nunca importa React/HTTP)
```

**Backend** (`backend/inventory-app/src/main/java/com/inventory/`):
- `domain/` — Entidades, value objects, puertos, eventos de dominio. Cero anotaciones de framework.
- `application/` — Casos de uso (commands/queries), DTOs, mappers (MapStruct). Orquesta el dominio vía puertos.
- `adapters/` — Web (Spring WebFlux controllers), Persistence (R2DBC repositories), Security (JWT).

**Frontend** (`frontend/src/`):
- `core/` — Entidades, puertos de repositorio, casos de uso. Sin dependencias de React.
- `infrastructure/` — Implementaciones de repositorios (IndexedDB, HTTP), cache, outbox.
- `presentation/` — Componentes React, hooks, TanStack Query, Zustand stores.

Ver ADR-001 en `docs/adr/architecture-decisions.md` para el detalle completo. Las decisiones arquitectónicas (ADR-001 al ADR-013) cubren desde la elección de WebFlux hasta la migración de Dexie.js → idb, Workbox → Serwist, y Leaflet → MapLibre.

## Características

- Offline-first con outbox + sync push/pull
- Multi-almacén (transferencias, ajustes, balances)
- Métodos de costeo: Estándar, WAC, FIFO
- POS táctil con multi-moneda (CUP, USD, EUR + tasas)
- Mapas offline (MapLibre + PMTiles en OPFS)
- PWA instalable con Serwist
- RBAC: ADMIN, MANAGER, SELLER
- Auditoría completa (actor, timestamp, before/after JSON)
- Import/Export CSV, XLSX, PDF
- LAN/Hotspot con Caddy HTTPS

## Quick Start

```bash
./start-dev.sh    # Backend :8080 + Frontend :3000
```

El script instala automáticamente Java 21, Maven, Node.js 22, pnpm (requiere PostgreSQL en :5432).

Para comandos detallados (tests, build, lint, typecheck, E2E, Docker), ver `AGENTS.md`.

## Documentación

- `docs/contracts/` — Endpoints, DTOs, DB schema, image handling
- `docs/design/` — Estrategia offline, UX, glosario
- `docs/adr/` — Decisiones arquitectónicas (ADR-001 al ADR-013)

## Licencia

MIT
