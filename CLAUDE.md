# CLAUDE.md — Inventario Offline‑First

> **⚠️ PRIMERO**: Leer [Pendiente.md](Pendiente.md) antes de cualquier tarea.

Sistema de gestión de inventario offline-first con Spring Boot WebFlux + Next.js PWA.

## Documentación Detallada

| Documento | Contenido |
|-----------|-----------|
| [docs/contracts/database-schema.md](docs/contracts/database-schema.md) | ERD y tablas |
| [docs/contracts/endpoints.md](docs/contracts/endpoints.md) | API REST |
| [docs/contracts/dtos.md](docs/contracts/dtos.md) | DTOs request/response |
| [docs/contracts/ports-interfaces.md](docs/contracts/ports-interfaces.md) | Use cases y ports |
| [docs/contracts/image-handling.md](docs/contracts/image-handling.md) | Imágenes y thumbnails |
| [docs/design/offline-strategy.md](docs/design/offline-strategy.md) | Sync offline |
| [docs/design/glossary.md](docs/design/glossary.md) | Glosario de dominio |
| [docs/adr/architecture-decisions.md](docs/adr/architecture-decisions.md) | ADRs |

---

## Reglas Absolutas (NO negociables)

### Arquitectura
- **Clean Architecture + Hexagonal (Ports & Adapters) + SOLID**
- `domain` NO depende de Spring, DB, HTTP, JSON ni anotaciones
- Adapters dependen hacia `application`/`domain`, nunca al revés

### Runtime 100% Offline
- Sin CDNs, Google Fonts remotas, scripts remotos, trackers, APIs externas
- Todo asset debe servirse localmente
- Herramientas externas solo en desarrollo

### Seguridad
- JWT (access 15min / refresh 7 días) + RBAC (ADMIN, MANAGER, SELLER)
- bcrypt cost 12, errores `application/problem+json`
- Auditoría completa (actor, timestamp, before/after)
- Prohibido commitear secrets

### Gratis / Open Source
Todo en runtime debe ser gratis/OSS

---

## 1) PRIMER PASO OBLIGATORIO: Skills / Best‑practices

Antes de escribir código, se deben cargar/mejorar prácticas con “skills” (plantillas) enfocadas a: arquitectura, backend, frontend, testing, seguridad.

### 1.1 Skills instalados (obligatorio consultarlos)

Todos los skills están en `.claude/skills/` (ubicación unificada).

#### Skills de arquitectura frontend (precedencia alta)
| Skill | Propósito | Precedencia |
|-------|-----------|-------------|
| `hexagonal` | Estructura frontend `core/infrastructure/presentation` | 1º para frontend |
| `project-structure` | Organización por módulos y hooks | 2º para frontend |
| `patterns` | Reglas de tamaño y división de componentes React | 3º para frontend |
| `shadcn` | Composición UI con shadcn/ui | Cuando aplique UI |

#### Skills de desarrollo
| Skill | Uso principal |
|-------|---------------|
| `senior-architect` | Diagramas de arquitectura, decisiones de diseño |
| `senior-backend` | Patrones API, seguridad backend (adaptar a Spring) |
| `senior-frontend` | Next.js, React, PWA |
| `react-best-practices` | Hooks, componentes, performance (45 reglas Vercel) |
| `webapp-testing` | Playwright, tests offline |
| `senior-security` | JWT, RBAC, auditoría |
| `docker-expert` | Containerización, multi-stage builds |
| `git-commit-helper` | Commits convencionales |

#### Skills de UI/UX
| Skill | Uso principal |
|-------|---------------|
| `ui-ux-pro-max` | Dashboard, UX configurable, 50 estilos |
| `ui-design-system` | Design tokens, paletas, tipografía, spacing grid |
| `tailwind-patterns` | Tailwind CSS v4, tokens de diseño |

#### Skills de soporte
| Skill | Uso principal |
|-------|---------------|
| `brainstorming` | Resolución de conflictos de diseño |
| `clean-code` | Código limpio, sin over-engineering |
| `error-resolver` | Diagnóstico sistemático de errores |
| `planning` | Planificación de tareas complejas |

### 1.2 Reglas de precedencia
1. **Backend**: manda `CLAUDE.md` (Spring Boot WebFlux). Skills de backend se usan como referencia de patrones.
2. **Frontend interno**: mandan `hexagonal` y `project-structure`.
3. **React/componentes**: manda `patterns` + `react-best-practices`.
4. **UI/styling**: manda `shadcn` + `ui-design-system` + `tailwind-patterns` + `ui-ux-pro-max`.
5. **Testing**: manda `webapp-testing`.
6. **Seguridad**: manda `senior-security` + sección 0.4 de este documento.

> Regla: si no hay skill adecuada, aplicar buenas prácticas manualmente pero **no omitir** seguridad, tests, CI, ni gates.

---

## 2) Gates (Definition of Done) — plan sin huecos

### Gate A — Diseño base (antes de código de negocio)
Debe existir:
1) ADR de arquitectura (Clean/Hex, módulos, convenciones, límites de dependencias).
2) Estructura de carpetas (Sección 3).
3) Glosario de dominio.
4) Especificación offline:
   - outbox local
   - idempotencia
   - sync push/pull
   - política de conflictos
   - estados UI (online/offline/syncing) + barra de progreso.
5) Plan LAN/hotspot + HTTPS local + CA confiada en teléfonos.
6) Modelo de costos: **3 métodos** (default estándar/manual, además WAC y FIFO) con reglas, donde el usuario seleccionara el o los que desee ver.
7) Lista de endpoints (Sección 5) y roles.

### Gate B — Contratos
1) ERD + constraints + índices (Sección 4).
2) Migraciones base versionadas (DECISIÓN CERRADA: **Flyway** vía JDBC en etapa de arranque/CI aunque runtime sea R2DBC).
3) OpenAPI 3 completo (endpoints + DTOs + errores + paginación + filtros + sync + import/export).
4) Puertos/Interfaces y casos de uso definidos (Sección 6).
5) DTOs/mappers definidos (Sección 7).

### Gate C — Scaffolding
1) Backend compila y arranca (WebFlux + R2DBC + seguridad base).
2) Frontend arranca (Next.js + BFF + PWA shell).
3) CI bloqueante: lint/format + unit + integration + e2e (incluye offline).
4) Reglas de arquitectura automáticas (ArchUnit) activas.

### Gate D..G — Implementación incremental
- D: catálogo + almacenes + ledger + balances.
- E: compras/ventas/devoluciones/ajustes/transferencias + costos.
- F: dashboard + export.
- G: offline sync completo + hardening.

### Gate Final — Docker/Portabilidad
Solo cuando todo pase tests.

---

## 3) Estructura de carpetas (obligatoria)

### 3.1 Monorepo
```
/backend
  /inventory-app
    /src/main/java/com/yourorg/inventory
      /bootstrap
      /config
      /domain
        /model
        /valueobject
        /ports
          /in
          /out
        /services
        /events
        /errors
      /application
        /usecase
          /command
          /query
        /dto
        /mapper
        /ports  (si separas puertos de entrada)
      /adapters
        /web
          /dto
          /mapper
          /controller (WebFlux `@RestController`)
        /persistence
          /entity
          /repository
          /mapper
        /security
        /integration (futuro)
    /src/main/resources
      /db/migration (Flyway)
      application.yml
    /src/test/java/...

/frontend
  /src
    /app                              # Solo rutas Next.js App Router
      /(public)
      /(auth)
      /(admin)
      /(pos)
      /(reports)
      /(settings)
      /api                            # BFF route handlers
    /core                              # DOMINIO (TypeScript puro)
      /entities                        # Interfaces/tipos de dominio
      /interfaces                      # Puertos (contratos)
      /use-cases                       # Lógica de negocio
    /infrastructure                    # ADAPTERS
      /api                             # Clientes HTTP (Axios)
      /repositories                    # Implementaciones de puertos
      /storage                         # IndexedDB, localStorage
      /mappers                         # DTO → Entity
    /presentation                      # UI
      /shared                          # Recursos globales
        /components/ui                 # shadcn/ui base
        /hooks                         # Hooks globales
        /lib                           # Utils, config
      /modules                         # Módulos por dominio
        /[module]
          /components                  # Componentes del módulo
          /hooks                       # Controllers (entry adapters)
          /views                       # Composiciones de vista
    /tests
  /public (solo assets locales, incluyendo /fonts)

/infra
  /docker
  /caddy (https local + CA)

/openapi
  inventory.openapi.yaml
```

### 3.2 Reglas frontend offline
- Prohibido cargar fuentes externas; usar fuentes locales en `/public/fonts`.
- Prohibido usar imágenes por URL remota como dependencia.

---

## 4) Contratos Detallados

Ver documentación en `docs/contracts/`:
- [database-schema.md](docs/contracts/database-schema.md) - Tablas y convenciones
- [endpoints.md](docs/contracts/endpoints.md) - API REST completa
- [dtos.md](docs/contracts/dtos.md) - DTOs request/response
- [ports-interfaces.md](docs/contracts/ports-interfaces.md) - Use cases y repository ports
- [image-handling.md](docs/contracts/image-handling.md) - Imágenes y thumbnails

---

## 5) Decisiones Técnicas Cerradas

| Decisión | Elección |
|----------|----------|
| Migraciones DB | Flyway (JDBC en arranque/CI) |
| Mappers | MapStruct |
| Reverse Proxy | Caddy (HTTPS local) |
| Password hash | bcrypt cost 12 |
| JWT Access | HS256, 15 min |
| Refresh Token | UUID hasheado, 7 días |
| Idempotency TTL | 72 horas |
| Sync cursor | bigserial (sync_log.id) |

---

## 6) Docker (solo cuando todo funcione)
- Multi-stage builds, no-root
- Caddy para HTTPS local (PWA móvil)
- Volúmenes: Postgres data, media/
- Sin internet en runtime

---

## 7) Checklist de Cumplimiento

- [ ] Gates A y B completos antes de features
- [ ] Runtime offline total
- [ ] Multi-almacén + ledger + balances
- [ ] Sync idempotente + outbox
- [ ] Import CSV job-based + dry-run
- [ ] Export CSV/XLSX/PDF
- [ ] Imágenes usuario/producto
- [ ] Auditoría completa
- [ ] CI bloqueante con tests
