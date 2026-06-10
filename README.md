# Gestión de Inventario — Offline-First

Sistema de gestión de inventario con soporte offline-first, sincronización bidireccional, multi-almacén, POS y mapa offline.

## Stack Tecnológico

- **Frontend**: Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- **Backend**: Spring Boot 3.4 + WebFlux + Java 21
- **Base de datos**: PostgreSQL 17 + R2DBC + Flyway
- **Offline**: IndexedDB (idb) + OPFS + Serwist SW + TanStack Query + Zustand
- **Mapas**: MapLibre GL JS + PMTiles
- **Proxy**: Caddy 2

## Arquitectura

**Backend**: Clean Architecture + Hexagonal (Ports & Adapters)
```
domain → application → adapters (web / persistence / security)
```
- `domain/`: Entidades, puertos, servicios (sin dependencias de Spring/DB/JSON)
- `application/`: Casos de uso, DTOs, mappers
- `adapters/`: Web REST, Persistence R2DBC, Security JWT

**Frontend**: Hexagonal adaptado
```
core → infrastructure → presentation
```
- `core/`: Entidades, puertos, casos de uso (sin React/HTTP)
- `infrastructure/`: Repositorios, almacenamiento, APIs
- `presentation/`: Componentes React, hooks, vistas

## Características

- **Offline-first**: lectura local-first, escrituras en outbox, sync push/pull con cursor bigserial
- **Multi-almacén**: transferencias, ajustes, balances por almacén
- **Métodos de costeo**: Estándar, WAC y FIFO
- **PWA instalable**: Service Worker, funciona sin conexión
- **Mapas offline**: MapLibre GL JS + PMTiles en OPFS
- **Dashboard en tiempo real**: KPIs, ventas, productos bajo stock
- **Multi-moneda**: CUP, USD, EUR + tasas de cambio
- **Import/Export**: CSV, XLSX, PDF
- **RBAC**: ADMIN, MANAGER, SELLER
- **Auditoría completa**: actor, timestamp, before/after JSON
- **LAN/Hotspot**: despliegue sin internet, HTTPS local con Caddy

## Desarrollo Local

### Prerrequisitos
- Java 21 LTS, Maven 3.9+, Node.js 22+, pnpm
- PostgreSQL 17 (o Docker)

### Backend
```bash
cd backend/inventory-app
./mvnw spring-boot:run
# API en http://localhost:8080
```
Migraciones Flyway automáticas al arrancar. Usuario por defecto: `admin` / `admin123`.

### Frontend
```bash
cd frontend
pnpm install
pnpm dev
# App en http://localhost:3000
```

### Docker Compose (producción)
```bash
docker compose up -d
# App en https://localhost
```

### LAN/Hotspot
```bash
# Exportar CA de Caddy para instalar en dispositivos móviles
docker compose exec caddy cat /data/caddy/pki/authorities/local/root.crt > caddy_ca.crt
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `./start-dev.sh` | Backend (:8080) + Frontend (:3000) |
| `./stop-dev.sh` | Detener servicios |
| `cd frontend && pnpm test:run` | Tests frontend (Vitest) |
| `cd backend/inventory-app && mvn test` | Tests backend (JUnit 5) |
| `node e2e-tests.mjs` | E2E Playwright |

## Documentación

- `docs/contracts/` — Endpoints, DTOs, DB schema, image handling
- `docs/design/` — Estrategia offline, UX, glossary
- `docs/adr/` — Decisiones arquitectónicas (ADR)
- `docs_dev/task_plan.md` — Plan de implementación activo

## Licencia

MIT
