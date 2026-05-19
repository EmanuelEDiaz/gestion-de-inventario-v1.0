# AGENTS.md — Inventario Offline-First

> ⚠️ Next.js 16 tiene breaking changes — leer `node_modules/next/dist/docs/` antes de código
> ⚠️ Prohibido usar `kill` para detener node/npm (ver reglas-globales-opencode)

## Comandos

### Desarrollo local
```bash
./start-dev.sh           # Backend(:8080) + Frontend(:3000) en terminales separadas
./stop-dev.sh            # Detener servicios
```

`start-dev.sh` auto-instala Java 21, Maven, Node.js 22, pnpm. Requiere PostgreSQL en :5432.

### Frontend (`cd frontend`, usar pnpm)
```bash
pnpm dev --webpack                        # Dev server :3000 (--webpack required)
pnpm build --webpack                      # Build producción
pnpm lint                                 # ESLint
pnpm test:run                             # Vitest (single run)
pnpm test                                 # Vitest (watch)
pnpm vitest run src/core/entities/product.test.ts  # Test específico

# Primera vez o si cambia lockfile:
pnpm approve-builds sharp unrs-resolver   # Aprueba builds nativos (requerido)
```

### Backend (`cd backend/inventory-app`, Maven Wrapper)
```bash
./mvnw spring-boot:run                    # Dev server :8080
./mvnw test                               # Suite completa (JUnit 5 + ArchUnit)
./mvnw test -Dtest=ProductControllerTest  # Clase específica
./mvnw clean package                      # Build JAR
```

Flyway corre migraciones automáticamente al arrancar. Default creds: `admin` / `admin123`.

### E2E
```bash
node e2e-tests.mjs                        # Playwright directo (requiere :3000 + :8080)
cd frontend && npx playwright test        # Tests en tests/
```

### Docker
```bash
docker compose up -d      # postgres → backend → frontend → caddy
# URLs: http://localhost:8080 (API), https://localhost (App)
```

## Graphify — Knowledge Graph (usar ANTES de grep)

```bash
graphify query "pregunta" --budget 2000   # BFS contexto amplio
graphify update .                         # Post-cambio (rápido, solo AST)
```

Ver `graphify-out/GRAPH_REPORT.md` para god nodes y comunidades.

## Reglas clave

- **UI**: Español (labels, tooltips, errores). **Código**: Inglés
- **Sin internet en runtime**: cero CDNs, fuentes externas, APIs remotas. Assets en `/public`
- **Mobile-first**: Touch-first, responsive
- **Sin `any`** sin justificación explícita
- **Errores frontend**: Extender `Error`, tipar en `catch`
- **Errores backend**: Implementar `DomainException`, responder `application/problem+json`
- **Estado**: TanStack Query (datos servidor) + Zustand (UI) — NO Redux, NO React state para server data
- **Skills obligatorias**: Cargar `senior-frontend` o `senior-fullstack` antes de código
- **Skills symlinks**: Nueva skill → symlink en `.opencode/skills/` → `.claude/skills/<name>`

## Arquitectura

Backend hexadonal: `domain/ → application/ → adapters/` (domain NO depende de Spring/DB/JSON)
Frontend hexadonal: `core/ → infrastructure/ → presentation/` (core NO depende de React/HTTP)

| Capa | Stack |
|------|-------|
| Backend | Spring Boot 3.4 + WebFlux + Java 21 |
| DB | PostgreSQL 17 + R2DBC + Flyway |
| Frontend | Next.js 16 + React 19 + TypeScript 5 |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Offline | IndexedDB (idb) + Service Worker + Outbox |
| Proxy | Caddy 2 (HTTPS local auto-firmado) |

## Documentación útil

- `CLAUDE.md` — Reglas arquitectura y Definition of Done
- `docs/contracts/` — DB schema, endpoints, DTOs, ports
- `docs/design/offline-strategy.md` — Sync offline
- `frontend/AGENTS.md` — Advertencias Next.js 16
- `.github/copilot-instructions.md` — Guía completa de tareas comunes

## OpenCode plugins

`.opencode/plugins/graphify.js`, `.opencode/plugins/skills-checker.js` — cargados automáticamente.
