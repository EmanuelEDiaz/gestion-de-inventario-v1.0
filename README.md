# Sistema de Gestión de Inventario — Offline-First

Sistema de inventario **offline-first** con soporte multi-almacén, punto de venta (POS), reportes y sincronización LAN/hotspot. Funciona completamente sin internet una vez desplegado.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Spring Boot 3.4.1 + WebFlux (reactivo) + Java 21 |
| Base de Datos | PostgreSQL 17 + R2DBC |
| Migraciones | Flyway (JDBC en arranque) |
| Auth | JWT HS256 (15min access) + Refresh UUID (7d) · bcrypt cost 12 |
| Frontend | Next.js 16 + React 19 + TypeScript 5 |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Estado offline | IndexedDB (idb) + Service Worker + Outbox pattern |
| Reverse Proxy | Caddy 2 (HTTPS local auto-firmado para PWA móvil) |

## Arquitectura

**Backend**: Clean Architecture + Hexagonal (Ports & Adapters)
```
domain → application → adapters (web / persistence / security)
```

**Frontend**: Hexagonal adaptado
```
core (entidades/use-cases) → infrastructure (repos/api/indexedDB) → presentation (components)
```

## Características

- **Multi-almacén**: transferencias, ajustes, balances por almacén
- **Métodos de costeo**: Estándar, WAC y FIFO (configurable)
- **Sync offline**: outbox local → push/pull con cursor bigserial, auto-sync cada 30s
- **PWA instalable**: Service Worker, manifest, funciona sin conexión
- **Dashboard en tiempo real**: KPIs, ventas hoy/semana, productos bajo stock
- **Import CSV**: job-based con dry-run y mapeo de columnas
- **Export**: CSV, XLSX, PDF
- **Auditoría completa**: actor, timestamp, before/after JSON
- **RBAC**: ADMIN, MANAGER, SELLER

## Estructura del Proyecto

```
/
├── backend/
│   ├── Dockerfile
│   └── inventory-app/          # Spring Boot WebFlux
│       ├── src/main/java/com/inventory/
│       │   ├── domain/         # Entidades, puertos, servicios (sin dependencias)
│       │   ├── application/    # Casos de uso, DTOs, mappers
│       │   └── adapters/       # Web REST, Persistence R2DBC, Security JWT
│       └── src/main/resources/
│           └── db/migration/   # Flyway V1..VN
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── app/                # Next.js App Router (rutas)
│       ├── core/               # Dominio TypeScript puro
│       ├── infrastructure/     # Adapters (HTTP Axios, IndexedDB, SyncService)
│       └── presentation/       # UI (módulos, hooks, componentes shadcn)
├── infra/
│   └── caddy/Caddyfile         # HTTPS local + CA auto-firmada
├── docs/
│   ├── contracts/              # DB schema, endpoints, DTOs, ports
│   ├── design/                 # Offline strategy, glossary
│   └── adr/                    # Architecture Decision Records
├── docker-compose.yml
└── .env.example
```

## Inicio Rápido (Desarrollo Local)

### Prerrequisitos
- Java 21 LTS
- Maven 3.9+
- Node.js 20+ + pnpm 9+
- PostgreSQL 17 (o Docker)

### Base de datos con Docker

```bash
docker run -d --name inventory-postgres \
  -e POSTGRES_DB=inventory_dev \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:17-alpine
```

### Backend

```bash
cd backend/inventory-app
./mvnw spring-boot:run
# API en http://localhost:8080
```

Variables de entorno (o editar `src/main/resources/application.yml`):
```
SPRING_R2DBC_URL=r2dbc:postgresql://localhost:5432/inventory_dev
SPRING_R2DBC_USERNAME=postgres
SPRING_R2DBC_PASSWORD=postgres
JWT_SECRET=secreto_minimo_32_caracteres_aqui
```

Las migraciones Flyway se ejecutan automáticamente. Usuario por defecto: `admin` / `admin123`.

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
# App en http://localhost:3000
```

## Docker Compose (Producción)

```bash
# 1. Configurar variables secretas
cp .env.example .env
# Editar .env con contraseñas seguras (mínimo 32 chars para JWT_SECRET)

# 2. Levantar todos los servicios
docker compose up -d

# App disponible en https://localhost
```

### HTTPS local para dispositivos móviles (misma red LAN/hotspot)

```bash
# Exportar CA de Caddy para instalar en el teléfono
docker compose exec caddy cat /data/caddy/pki/authorities/local/root.crt > caddy_ca.crt

# Android: Configuración → Seguridad → Instalar certificado → CA certificate
# iOS: Configuración → General → VPN y gestión del dispositivo
#      Luego: Configuración → General → Información → Cert. de confianza

# Para acceder por IP LAN, editar infra/caddy/Caddyfile:
# reemplazar 'localhost' con la IP del servidor (ej: 192.168.1.100)
```

## API REST

Base URL: `http://localhost:8080/api/v1`

| Módulo | Endpoints |
|--------|----------|
| Auth | `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` |
| Productos | `GET/POST /products` · `GET/PUT/DELETE /products/{id}` |
| Almacenes | `GET/POST /warehouses` · `GET/PUT/DELETE /warehouses/{id}` |
| Stock | `GET /stock/balances` · `GET /stock/movements` |
| Compras | `GET/POST /purchases` · `PUT /purchases/{id}/receive` |
| Ventas | `GET/POST /sales` · `PUT /sales/{id}/confirm` |
| Transferencias | `GET/POST /transfers` |
| Ajustes | `GET/POST /adjustments` |
| Devoluciones | `GET/POST /returns` |
| Clientes | `GET/POST /customers` |
| Proveedores | `GET/POST /suppliers` |
| Dashboard | `GET /dashboard/stats` · `GET /dashboard/low-stock` |
| Sync | `GET /sync/pull?cursor=X` |

## Roles (RBAC)

| Rol | Permisos |
|-----|---------|
| ADMIN | Acceso total |
| MANAGER | Compras, ventas, transferencias, ajustes, reportes, dashboard |
| SELLER | Ventas, consultas de stock y dashboard |

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | Spring Boot 3.4 + WebFlux (reactivo) |
| Base de Datos | PostgreSQL 16 + R2DBC |
| Migraciones | Flyway (JDBC) |
| Auth | JWT HS256 (15min) + Refresh UUID (7d) |
| Frontend | Next.js 16 + React 19 + TypeScript |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Estado offline | IndexedDB (idb) + Zustand + TanStack Query |
| Reverse Proxy | Caddy (HTTPS local para PWA) |

## Arquitectura

**Backend**: Clean Architecture + Hexagonal (Ports & Adapters)
```
domain → application → adapters (web / persistence / security)
```

**Frontend**: Hexagonal adaptado
```
core (entidades/use-cases) → infrastructure (repos/api) → presentation (components)
```

## Características

- **Multi-almacén**: transferencias, ajustes, balances por almacén
- **Métodos de costeo**: Estándar, WAC y FIFO (configurable)
- **Sync offline**: outbox local → push/pull con cursor bigserial
- **Import CSV**: job-based con dry-run y mapeo de columnas
- **Export**: CSV, XLSX, PDF
- **Imágenes**: avatares de usuario y múltiples imágenes por producto (con thumbnails)
- **Auditoría completa**: actor, timestamp, before/after JSON
- **RBAC**: ADMIN, MANAGER, SELLER
- **Multi-moneda**: CUP, USD, EUR + tasas de cambio editables

## Estructura del Proyecto

```
/
├── backend/
│   └── inventory-app/          # Spring Boot WebFlux
│       ├── src/main/java/com/inventory/
│       │   ├── bootstrap/      # Arranque
│       │   ├── config/         # Configuración Spring
│       │   ├── domain/         # Entidades, puertos, servicios
│       │   ├── application/    # Casos de uso, DTOs
│       │   └── adapters/       # Web REST, Persistence, Security
│       └── src/main/resources/
│           ├── db/migration/   # Flyway migrations
│           └── application.yml
├── frontend/
│   └── src/
│       ├── app/                # Next.js App Router (rutas)
│       ├── core/               # Dominio TypeScript puro
│       ├── infrastructure/     # Adapters (HTTP, IndexedDB)
│       └── presentation/       # UI (módulos, componentes)
├── infra/
│   ├── docker/
│   └── caddy/                  # HTTPS local + CA
├── openapi/
│   └── inventory.openapi.yaml
└── docs/
    ├── contracts/              # DB schema, endpoints, DTOs, ports
    ├── design/                 # Offline strategy, glossary
    └── adr/                    # Architecture Decision Records
```

## Inicio Rápido (Desarrollo)

### Prerrequisitos
- Java 21 LTS
- Maven 3.9+
- Node.js 22+ + pnpm
- PostgreSQL 16
- Docker (opcional para entorno completo)

### Backend

```bash
# Configurar base de datos
createdb inventory_db

# Variables de entorno (crear .env o usar application-dev.yml)
export DB_USER=postgres
export DB_PASSWORD=postgres
export JWT_SECRET=<secret-min-32-chars>
export INVENTORY_MEDIA_ROOT=./media

# Arrancar
cd backend/inventory-app
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

El backend arranca en `http://localhost:8080`.

Flyway ejecuta las migraciones automáticamente al iniciar.

Usuario admin por defecto: `admin` / `admin123` (cambiar en producción).

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

El frontend arranca en `http://localhost:3000`.

### Con Docker Compose (recomendado)

> Disponible cuando el backend y frontend estén estables.

```bash
docker-compose up -d
```

Incluye: PostgreSQL, backend, frontend+BFF, Caddy (HTTPS local).

## Documentación de Contratos

| Documento | Descripción |
|-----------|-------------|
| [docs/contracts/database-schema.md](docs/contracts/database-schema.md) | ERD y definición de tablas |
| [docs/contracts/endpoints.md](docs/contracts/endpoints.md) | API REST completa con roles |
| [docs/contracts/dtos.md](docs/contracts/dtos.md) | DTOs de request/response |
| [docs/contracts/ports-interfaces.md](docs/contracts/ports-interfaces.md) | Use cases y repository ports |
| [docs/contracts/image-handling.md](docs/contracts/image-handling.md) | Imágenes y thumbnails |
| [docs/design/offline-strategy.md](docs/design/offline-strategy.md) | Sync offline y outbox |
| [docs/design/glossary.md](docs/design/glossary.md) | Glosario del dominio |
| [docs/adr/architecture-decisions.md](docs/adr/architecture-decisions.md) | Decisiones de arquitectura |

## Reglas de Desarrollo

1. **Diseño primero**: contratos (DB + OpenAPI + puertos) antes de código
2. **Sin internet en runtime**: cero CDNs, fuentes externas ni APIs remotas
3. **Dependencias correctas**: `domain` no importa Spring ni librerías externas
4. **Tests obligatorios**: ArchUnit activo + CI bloqueante

Ver [CLAUDE.md](CLAUDE.md) para reglas completas.

## Roles y Permisos

| Rol | Acceso |
|-----|--------|
| ADMIN | Todo |
| MANAGER | Operaciones + catálogo (sin usuarios) |
| SELLER | Solo ventas y consultas de stock |

## Licencia

MIT
