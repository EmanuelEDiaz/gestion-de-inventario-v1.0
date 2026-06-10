# Frontend — Gestión de Inventario

Frontend offline-first para el sistema de gestión de inventario.

## Stack

- Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- TanStack Query + Zustand (estado)
- idb (IndexedDB) + OPFS (almacenamiento local)
- Serwist (Service Worker)
- MapLibre GL JS + PMTiles (mapas offline)

## Scripts

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Dev server en :3000 (turbopack) |
| `pnpm build` | Build producción |
| `pnpm lint` | ESLint |
| `pnpm test:run` | Vitest (single run) |
| `pnpm test` | Vitest (watch) |

## Arquitectura

Arquitectura hexagonal: `core/` → `infrastructure/` → `presentation/`.

- `core/` — Entidades, puertos, casos de uso (sin dependencias de React/HTTP)
- `infrastructure/` — Repositorios, almacenamiento, APIs, loggers
- `presentation/` — Componentes React, hooks, vistas

## Offline

La aplicación está diseñada para funcionar sin conexión indefinidamente:
- Lectura siempre desde IndexedDB (local-first)
- Escrituras se guardan localmente y se sincronizan con el servidor
- Mapas offline via OPFS + MapLibre
- Imágenes cacheadas en OPFS
