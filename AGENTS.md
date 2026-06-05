# AGENTS.md — Inventario Offline-First

> ⚠️ Next.js 16 tiene breaking changes — leer `node_modules/next/dist/docs/` antes de código
> ⚠️ Prohibido usar `kill` para detener node/npm (ver reglas-globales-opencode)

## Desarrollo local
- `./start-dev.sh` — Backend (:8080) + Frontend (:3000) en terminales separadas. Auto-instala Java 21, Maven, Node.js 22, pnpm. Requiere PostgreSQL en :5432.
- `./stop-dev.sh` — Detener servicios

## Frontend (`cd frontend`, usar pnpm)
- `pnpm dev` — Dev server :3000 (turbopack)
- `pnpm build` — Build producción
- `pnpm lint` — ESLint
- `pnpm test:run` — Vitest (single run)
- `pnpm test` — Vitest (watch)
- `pnpm vitest run src/core/entities/product.test.ts` — Test específico
- Primera vez o si cambia lockfile: `pnpm approve-builds sharp unrs-resolver`

## Backend (`cd backend/inventory-app`, Maven Wrapper)
- `mvn spring-boot:run` — Dev server :8080
- `mvn test` — Suite completa (JUnit 5 + ArchUnit)
- `mvn test -Dtest=ProductControllerTest` — Clase específica
- `mvn clean package` — Build JAR
- Flyway corre migraciones automáticamente al arrancar. Credenciales por defecto: `admin` / `admin123`

## E2E
- `node e2e-tests.mjs` — Playwright directo (requiere :3000 + :8080)
- `cd frontend && npx playwright test` — Tests en tests/

## Docker
- `docker compose up -d` — postgres → backend → frontend → caddy
- URLs: http://localhost:8080 (API), https://localhost (App)

## Graphify — Knowledge Graph (usar ANTES de grep)
- `graphify query "pregunta" --budget 2000` — BFS contexto amplio
- `graphify update .` — Post-cambio (rápido, solo AST)
- Ver `graphify-out/GRAPH_REPORT.md` para god nodes y comunidades

## Reglas clave
- UI: Español (labels, tooltips, errores). Código: Inglés
- Sin internet en runtime: cero CDNs, fuentes externas, APIs remotas. Assets en `/public`
- Mobile-first: Touch-first, responsive
- Sin `any` sin justificación explícita
- Errores frontend: Extender `Error`, tipar en `catch`
- Errores backend: Implementar `DomainException`, responder `application/problem+json`
- Estado: TanStack Query (datos servidor) + Zustand (UI) — NO Redux, NO React state para server data
- Skills obligatorias: Cargar `senior-frontend` o `senior-fullstack` antes de código
- Skills symlinks: Nueva skill → symlink en `.opencode/skills/` → `.claude/skills/<name>`

## Verificación pre-commit (lección FIX-011)
Antes de `git commit`, ejecutar siempre:
1. `git status --short` — ver qué cambió
2. `git diff --stat` — confirmar que los archivos son los esperados
3. `git log --oneline -5` — revisar el último commit de la fase activa
4. Comparar el working tree contra el HEAD de la fase: ¿hay archivos que deberían estar restaurados al estado del último commit de fase? (FIX-011 documenta un caso donde el working tree había revocado invariantes de B.1)
5. `pnpm exec tsc --noEmit` (frontend) y/o `mvn compile -q` (backend) — type-check
6. `pnpm test:run` (frontend) y/o `mvn test` (backend) — suite completa

Si un archivo del working tree revoca una invariante de un commit de fase previo, hacer `git checkout HEAD -- <archivo>` antes de commitear.

## Arquitectura
- Backend hexagonal: `domain → application → adapters` (domain NO depende de Spring/DB/JSON)
- Frontend hexagonal: `core → infrastructure → presentation` (core NO depende de React/HTTP)
- Stack:
  - Backend: Spring Boot 3.4 + WebFlux + Java 21
  - DB: PostgreSQL 17 + R2DBC + Flyway
  - Frontend: Next.js 16 + React 19 + TypeScript 5
  - Estilos: Tailwind CSS v4 + shadcn/ui
  - Offline: IndexedDB (idb) + Service Worker + Outbox
  - Proxy: Caddy 2 (HTTPS local auto-firmado)

## Documentación útil
- `CLAUDE.md` — Reglas arquitectura y Definition of Done
- `docs/contracts/` — DB schema, endpoints, DTOs, ports
- `docs/design/offline-strategy.md` — Sync offline
- `frontend/AGENTS.md` — Advertencias Next.js 16
- `.github/copilot-instructions.md` — Guía completa de tareas comunes

## OpenCode plugins
- `.opencode/plugins/graphify.js`, `.opencode/plugins/skills-checker.js` — cargados automáticamente.