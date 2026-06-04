# Plan: Arreglar Carga Inicial + Mapa Offline + Sync

> Created: 2026-06-02 | Refined v5.2 — fixed geo endpoints (NO /api/v1/geo-regions, real: /api/v1/geo/*), fixed customer repo reference (NO localCustomerRepository.ts, real: CustomerRepository.ts), added DashboardRepository compute-from-local detail, added dependency verification table with codebase audit, incorporated evaluation findings | Canonical a partir de 2026-06-04
>
> ⚠️ **Este documento es canónico**: refleja fielmente lo implementado hasta la fecha. Otros archivos en `docs_dev/` son planes temporales. No modificar `task_plan.md` sin actualizar también el código para que coincida.

## Objetivos del Plan

### Objetivo 1 — Carga inicial robusta y local-first
| Meta | Indicador |
|------|-----------|
| Separar `phase` (técnica) de `availability` (funcional) en el loader | Zustand store con dos campos independientes |
| Arranque instantáneo desde cache local via `rehydrate_local` | `ready_partial` en < 2s si core dataset existe en IDB |
| Fix endpoint de productos (nunca cacheaba en IDB) | `pnpm run dev` muestra productos offline |
| Migrar 14+ repos de HTTP-first a local-first | `rg "apiClient.get" frontend/src/infrastructure/repositories/` solo retorna auth/user/audit |
| Logger estructurado con buffer+flush+guard `idbReady` | Sin `console.error` en producción |
| DB v5 con índices realmente usados por consultas de UI | `db.count('products') > 0` offline |

### Objetivo 2 — Mapa offline con MapLibre GL JS + PMTiles + OPFS
| Meta | Indicador |
|------|-----------|
| Migrar Leaflet → MapLibre GL JS con PMTiles nativo | Mapa renderiza tiles vectoriales desde OPFS sin conexión |
| PMTiles servido con Range requests via `FileSystemResource` | `curl -I /api/v1/maps/cuba.pmtiles` responde `Accept-Ranges: bytes` |
| Búsqueda geográfica offline (provincias, municipios, ciudades) | `useGeoSearch("La Habana")` retorna resultados sin red |
| GPS on-demand sin degradación de boot | Botón "Mi ubicación" inicia `watchPosition` solo al click |
| Descarga de mapa desde Settings (no durante boot) | `StoragePanel` con progreso, cancelable, checksum validado |
| Compartir ubicación con link universal | Botón "Compartir" → `navigator.share()` o copia portapapeles |
| Bundle: MapLibre ~500KB gzipped, code-split via `dynamic({ ssr: false })` | Lighthouse bundle analyzer confirma separación |

### Objetivo 3 — Sincronización robusta y manejo de conflictos
| Meta | Indicador |
|------|-----------|
| Outbox con prioridad Tipo B > Tipo A + lock cross-tab `navigator.locks` | Dos tabs no procesan outbox simultáneamente |
| Refresh token rotation single-use + TTL access token 15 min | `POST /api/v1/auth/refresh` emite nuevo refresh + revoca anterior |
| Sincronización cross-tab de tokens via `BroadcastChannel` + `storage event` | Tab B recibe token refrescado sin refresh propio |
| Field-by-field diff en `SyncConflictResolver` | `serverPayload` vs `clientPayload` renderizado en tabla |
| Escrituras críticas (Tipo B) requieren consentimiento offline | `ConfirmDialog` antes de encolar ventas/transferencias/ajustes offline |

### Objetivo 4 — Mantenimiento local automático
| Meta | Indicador |
|------|-----------|
| `MaintenanceService` con pruning programado (cada 30 min, boot, post-sync) | `appLogger` confirma purgas por TTL |
| LRU eviction de imágenes cuando OPFS supera 100MB | `imageIndex` entries eliminados por `lastAccessedAt` |
| Alarmas de cuota < 20% / < 10% con banner persistente | `storage.estimate()` monitoreado cada 5 min |
| Cleanup de chunks huérfanos, temporales OPFS, caches SW viejas | Sin acumulación de datos muertos |

### Objetivo 5 — Estrategia de imágenes offline
| Meta | Indicador |
|------|-----------|
| Tres niveles: thumbnail/preview/full-resolution en OPFS | `OfflineImage` con prop `size` |
| `ImageResolver` traduce `/api/v1/.../images/...` a ObjectURLs OPFS | Imágenes visibles offline |
| `useImageCache` hook con auto-revoke de ObjectURLs en cleanup | Sin memory leaks por `URL.createObjectURL` |
| Fallback si OPFS no disponible (Firefox Private, Safari ≤ 16) | `isOPFSAvailable()` → degradación graceful, no bloquea |

### Objetivo 6 — Código limpio y documentación consolidada
| Meta | Indicador |
|------|-----------|
| Eliminar código muerto (Leaflet, imageCache, totalSteps, console.error) | `pnpm exec tsc --noEmit` sin errores de módulos faltantes |
| Actualizar README con arquitectura offline-first, stack real | README sin duplicados, PostgreSQL 17, endpoints correctos |
| ADRs para decisiones clave (idb, Serwist, MapLibre) | `docs/adr/architecture-decisions.md` actualizado con ADR-009/010/011 |

---

## Reglas de Ejecución

> ⚠️ Estas reglas consolidan CLAUDE.md, AGENTS.md, copilot-instructions.md y la auditoría del codebase. Son vinculantes para toda implementación en este plan.

- **Una fase a la vez**: ejecutar → verificar → preguntar al usuario si continuar
- **Commit por fase**: cada fase termina con `git add . && git commit -m '<tipo>(<scope>): <mensaje>'` siguiendo conventional commits
- **Skills por fase**: cargar la skill indicada al inicio de cada fase antes de tocar código
- **Verificación obligatoria**: `pnpm build` (frontend, turbopack) + `pnpm lint`
- **Cada fase usa máximo 3 sub-agentes en paralelo para acelerar ejecución**
- **UI**: Español (labels, tooltips, errores). **Código**: Inglés
- **Arquitectura hexagonal frontend**: `core/` → `infrastructure/` → `presentation/` (core NO depende de React/HTTP)
- **Mobile-first**: Touch targets ≥44px, responsive. Verificar: nuevos componentes interactivos deben usar `min-h-11` (44px).
- **Tooltips obligatorios**: Todo botón de acción, campo de formulario debe tener tooltip. Usar `<TooltipHint>` o `<TooltipWrapper>` de `@/presentation/shared/components/ui/tooltip`.
- **Reutilización obligatoria de UI genérica**: Antes de crear un componente nuevo, revisar y reutilizar componentes existentes en `presentation/shared/components/`. Priorizar siempre componentes genéricos ya disponibles (toast, tooltip, dialog, alert, badge, skeleton, progress, empty state, error state, form fields, tables, panels). Solo crear un componente nuevo cuando el caso no esté cubierto razonablemente por uno existente o cuando extender el genérico degrade su claridad o mantenibilidad.
- **Lectura local-first**: La UI SIEMPRE lee de repositorios locales basados en IDB. TanStack Query usa `queryFn` que llama a repos locales, no a `apiClient.get()` directamente. El sync service actualiza IDB y luego invalida queries.
- **Escrituras editables normales**: guardado local inmediato, marcado como pending sync, push al backend cuando haya conexión. Si conflicto → incidente + resolución manual.
- **Escrituras críticas** (confirmar venta, cerrar transferencia, ajuste final): Requieren conexión o consentimiento explícito del usuario para encolar offline (Tipo B). Ver D.5 para protocolo concreto.
- **Offline-first absoluto**: La app NO debe hacer llamadas HTTP a servicios externos en runtime.
- **Sin `any`** sin justificación explícita
- **`navigator.locks` para coordinación multi-tab**: Cualquier operación que descargue chunks (productos, etc.) debe usar `navigator.locks.request('download-lock', ...)` para evitar race conditions entre tabs. IDB transactions son por tab, no globales. Sin lock explícito, dos tabs pueden descargar el mismo chunk simultáneamente, corrompiendo `downloadChunks` journal.
  **Fallback**: Si `navigator.locks` no está disponible (Safari < 15.4), ejecutar sin lock — la race condition solo ocurre si 2+ tabs descargan exactamente el mismo chunk, y es aceptable como degradación temporal.
- **`URL.revokeObjectURL` obligatorio en todo componente que cree Object URLs**: Cada `URL.createObjectURL(blob)` reserva memoria del navegador que solo se libera con `URL.revokeObjectURL(url)`. Sin revoke, sesiones largas acumulan memoria indefinidamente (memory leak). **Regla**: Todo `useEffect` que cree ObjectURLs debe retornar un cleanup que las revoque. Todo hook que exponga ObjectURLs debe revocarlas en su cleanup. Casos identificados: `useImageUrl`, `useImageCache`, `ImageResolver`, `OPFSTileSource` (parcial — file.slice en getBytes no crea ObjectURLs).
- **Estado frontend**: TanStack Query (datos servidor) + Zustand (UI) — **NO Redux**, **NO React state para server data**
- **Prohibido `console.log/warn/info/debug/error`** en producción. Usar `appLogger` wrapper para debugging
- **`appLogger` interface** (definir en `src/core/logging/types.ts`):
  ```typescript
  export interface AppLogger {
    debug(msg: string, ctx?: Record<string, unknown>): void;
    info(msg: string, ctx?: Record<string, unknown>): void;
    warn(msg: string, ctx?: Record<string, unknown>): void;
    error(msg: string, err?: unknown, ctx?: Record<string, unknown>): void;
  }
  ```
  - Buffer en memoria, flush periódico a IDB store `appLogs` (no más de 5000 entradas, TTL 7 días)
  - En desarrollo (`process.env.NODE_ENV !== 'production'`): también imprime a console para debugging inmediato
  - En producción: solo escribe a IDB, nunca a console
  - Implementación concreta en `src/infrastructure/logging/AppLoggerService.ts`
- **Prohibido `catch(e) {}`** sin tipar — siempre tipar el error capturado
- **Componentes** max ~100 líneas; hooks max ~150 líneas
- **Import order**: external → core → infrastructure → presentation (dentro de cada grupo: interfaces → entities → use-cases → repos → components)
- **Frontend**: Vitest + React Testing Library, tests co-located (`*.test.ts`)
- **Patrón**: AAA (Arrange, Act, Assert)
- ⚠️ **Next.js 16 tiene breaking changes** — leer `node_modules/next/dist/docs/` antes de escribir código frontend. Heed deprecation notices.
- ⚠️ **MapLibre GL JS requiere `ssr: false` obligatorio**: `maplibre-gl` usa `window`, `WebGLRenderingContext`, y APIs del navegador no disponibles en SSR. Todo componente que importe MapLibre debe usar `next/dynamic` con `{ ssr: false }`. **Regla**: Archivos en `presentation/shared/components/map/` que usen MapLibre deben ser Client Components (`'use client'`) e importados via `dynamic()` en el componente padre. NO pueden ser Server Components. Pattern:
  ```typescript
  const MapViewer = dynamic(() => import('./MapViewer'), { ssr: false });
  ```
- **Excepción**: Componentes que solo usan tipos de MapLibre (no instancias runtime) pueden ser Server Components. Verificar con `typeof window !== 'undefined'` en módulos compartidos.
- ⚠️ **Prohibido `kill`** para detener node/npm
- **Permisos no bloqueantes**: La app no debe depender de prompts de permisos del navegador para iniciar. IDB, Cache API y OPFS operan como almacenamiento del origen sin prompts visibles. `navigator.storage.persist()` es best-effort y non-fatal — si no se concede persistencia, la app continúa igual con almacenamiento normal y registra warning en `appLogger`. Geolocalización se solicita solo on-demand.
- **Auditoría clasificada**: Toda auditoría ejecutada durante la carga se clasifica como **crítica** (schema incompatible, IDB no abre, core dataset inconsistente, cuota imposible) o **diagnóstica** (índice secundario faltante, checksum de mapa falló, catálogo secundario stale). Solo las auditorías críticas pueden impedir alcanzar `ready_partial`. Las diagnósticas registran incidente/log y degradan `availability` sin bloquear.
- **Reanudación de carga interrumpida**: Si el navegador cierra/recarga durante boot, `downloadChunks` actúa como journal. `rehydrate_local` revisa chunks huérfanos: `committed` → conservar, `downloading` → marcar `pending`, `failed` → retry con contador, `corrupted` → no retry automático infinito (enviar a repair center). Si el core dataset mínimo ya existe localmente, la app entra en `ready_partial` aunque el refresh haya quedado incompleto.
- **Migración IndexedDB multi-tab**: Al subir `DB_VERSION`, manejar evento `versionchange` y posible `blocked`. Si otra pestaña mantiene la DB abierta durante upgrade: mostrar banner/toast "Se requiere recargar otras pestañas de la aplicación", cerrar conexiones activas cuando llegue `versionchange`, forzar reload controlado. No dejar la app en estado ambiguo.

**Convención de nombres:**

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Archivos TS (entities/utils) | kebab-case | `app-loader-store.ts`, `download-queue-service.ts` |
| Archivos TS (repos/hooks/ports) | PascalCase | `AppLoaderStore.ts`, `useAppLoader.ts` |
| Componentes React | PascalCase | `CacheProgressBar.tsx` |
| Ports frontend | Prefijo `I` | `IProductRepository.ts` |
| Hooks frontend | Prefijo `use` | `useAppLoader.ts` |
| Directorios módulos | kebab-case | `loading/`, `network-status/` |

---

## Principios Arquitectónicos Refinados

### Principio rector
**Local-first UI, server-synchronized consistency.**

### Lectura
- La UI lee SIEMPRE desde repositorios locales basados en IDB.
- TanStack Query usa `queryFn` que llama a repos locales (`localProductRepository.getAll()`), NUNCA a `apiClient.get()` directamente como queryFn de lectura principal.
- Cuando hay conexión, el sync service actualiza IDB en background y luego invalida TanStack Query.
- Comportamiento idéntico online y offline — la UI no cambia según estado de red.
- NUNCA depender de fetch HTTP directo como camino principal de render.

**Paginación:**
- **Paginación de descarga/sync**: se realiza contra backend (`/products/paginated?page=...&size=100`) para controlar integridad, backpressure, retries y checksum por chunk.
- **Paginación de visualización UI**: se resuelve desde repositorios locales sobre IDB. Tablas, filtros, búsqueda y ordenamiento operan sobre el dataset local ya descargado. TanStack Query obtiene desde `localProductRepository.getAll()` y pagina/filtra en memoria o vía índices IDB.
- **Módulos on-demand** (audit-log, reportes pesados, búsqueda administrativa histórica): pueden mantener paginación remota contra backend, no se bajan completos.

### Escritura
**Tipo A — Escrituras editables normales** (products, customers, suppliers, categories, warehouses):
- Guardado local inmediato (optimistic local commit).
- Marcado como pending sync en outbox.
- Push al servidor cuando haya conexión.
- Si conflicto (optimistic locking con `version`), incidente + resolución manual.
- NUNCA merge silencioso.

**Tipo B — Escrituras críticas** (confirmar venta, cerrar transferencia, ajuste final de inventario):
- Requieren conectividad o consentimiento explícito del usuario para encolar offline.
- Si offline: mostrar `ConfirmDialog` informativo "Esta acción requiere confirmación del servidor". El usuario decide si encolar en estado pendiente o cancelar.
- Nunca encolar Tipo B sin consentimiento. Nunca mostrar `ErrorState` bloqueante de app.
- Si conflicto al reconectar, incidente obligatorio (ver D.5).

### Persistencia
- **IDB**: catálogos + datos operativos locales + outbox + dead letter + incidentes + metadata + geo-index + logs debug (buffer + flush).
- **OPFS**: mapa (PMTiles), exportaciones, adjuntos grandes.
- **SW cache**: assets estáticos, shell, mapa base — **NO cachear HTML/RSC con datos sensibles de usuario**.

### Política de Cache y Sesión Offline

**Cacheables permanentes** (nunca se invalidan):
- Assets estáticos (JS, CSS, imágenes, fuentes, íconos)
- Shell offline (layout, navegación)
- Mapa base (PMTiles + tiles)

**Lo que NO se cachea en SW**:
- HTML/RSC con datos sensibles del usuario — evitar exponer datos tras logout
- Respuestas API autenticadas — se sirven desde IDB, no desde SW cache

**Política de invalidación:**
- Namespace de cache SW por `userId` para evitar contaminación entre sesiones.
- No cachear páginas protegidas renderizadas en SW.

### Sesión Offline: Sesión Local vs Sesión Backend

#### Modelo de sesión dual

La app distingue dos niveles de sesión:

```typescript
type SessionState =
  | 'local-authenticated'        // usuario validado localmente, puede operar offline
  | 'local-locked'               // sesión local expirada por logout/inactividad
  | 'server-session-valid'       // backend confirma tokens vigentes
  | 'server-session-expired';    // refresh falló, sync bloqueado, solo lectura local
```

| Estado | Lectura local | Escritura local | Sync push | Descarga inicial |
|--------|--------------|----------------|-----------|-----------------|
| `local-authenticated` + `server-session-valid` | ✅ | ✅ | ✅ | ✅ |
| `local-authenticated` + `server-session-expired` | ✅ | ✅ | ❌ — pedir login | ❌ |
| `local-locked` | ❌ login | ❌ | ❌ | ❌ |

#### Reglas

- **Sesión local**: Se mantiene tras login inicial exitoso. Permite operar offline sobre datos cacheados. La expiración del access token NO invalida la sesión local mientras la app está offline.
- **Sesión backend**: Necesaria para sincronizar con servidor. Se valida mediante access token + refresh token.
- **La reconexión no debe expulsar al usuario automáticamente.** Mientras la app esté offline, la sesión local continúa operativa. Solo al reconectar, si la revalidación con backend falla de forma definitiva, se notifica y se requiere login para seguir sincronizando.

#### Lifetimes recomendados

| Token | Duración | Notas |
|-------|----------|-------|
| **Access token** | 15–30 minutos | Corto para reducir exposición |
| **Refresh token** | 30 días (2.592.000 segundos) | Largo, rotatorio si posible — **nunca más corto que access token** |

> ⚠️ El backend actual tiene access token configurado a 30 días. **Cambiar a 15–30 min** para alinearse con esta política. El refresh token se mantiene a 30 días.

#### Comportamiento al reconectar

> ⚠️ **Throttle de reconexión: mínimo 30s entre intentos de refresh.** Si el dispositivo oscila entre on/off (red inestable), el refresh se intentaría cada vez que detecte conexión. Usar timestamp de último intento guardado en IDB metadata (`syncMeta`, key `last-refresh-attempt`). Si ha pasado menos de 30s desde el último intento, saltar el refresh y esperar al próximo ciclo de detección de red.

**Caso A — Reconecta y refresh funciona:**
- Renovar tokens silenciosamente (sin notificar al usuario)
- Continuar sync normal
- Opcional: toast discreto "Conexión restablecida"

**Caso B — Reconecta y refresh falla (expirado/revocado):**
- **NO destruir la sesión local** ni los datos cacheados
- Transicionar `server-session-valid` → `server-session-expired`
- Mostrar **banner persistente**:
  > "Tu sesión con el servidor expiró. Puedes seguir consultando los datos locales, pero necesitas iniciar sesión para sincronizar."
- **Lectura local**: permitida
- **Escritura local a IDB**: permitida (con marca pending sync)
- **Sync push**: bloqueado hasta nuevo login
- **Sync pull**: bloqueado
- Botón "Iniciar sesión" en el banner que lleva a login sin perder el estado local
- Si el usuario fuerza logout: se limpian datos locales normalmente

#### Casos borde

- **Usuario nunca ha iniciado sesión**: sin datos locales, requiere conexión para login inicial
- **Offline prolongado**: if refresh sigue válido al reconectar semanas después, renovar silenciosamente
- **No se implementa cifrado de stores en esta fase** — queda documentado como límite conocido para evaluación futura junto con PIN/biometría.

### Política de Logout y Borrado de Datos Locales

**No borrar automáticamente todos los datos locales al logout si existen cambios pendientes de sincronizar.** El comportamiento varía según el contexto:

**Matriz de limpieza por grupo de store al logout:**

| Grupo | Stores | Logout sin cambios | Logout con cambios | Cambio de usuario |
|-------|--------|-------------------|--------------------|--------------------|
| **Globales reutilizables** | `products`, `categories`, `warehouses`, `geoIndex`, `imageIndex` + blobs OPFS, mapa OPFS | Conservar | Conservar | Conservar |
| **Sesión-scoped (siempre limpiar)** | `notifications`, `outbox`, `deadLetter`, `conflicts/incidents`, `auth/session metadata`, SW caches `userId` | Limpiar | Limpiar | Limpiar |
| **Pendientes de sync (limpiar condicional)** | `sales`, `purchases`, `movements`, `transfers`, `adjustments`, `returns`, `customers`, `suppliers`, `stockBalances`, `customerDebts` | Conservar | Preguntar (*) | Limpiar |
| **Diagnósticos** | `appLogs`, `corruptionQueue`, `downloadChunks` | Limpiar | Limpiar | Limpiar |

(*) En logout con cambios pendientes, preguntar: "¿Conservar datos para retomar sync después?" / "Borrar todo"

#### A. Logout sin cambios pendientes
No hay operaciones en outbox, dead letters vacías, conflictos resueltos:
- Limpiar tokens y sesión local
- Limpiar caches SW auth-scoped (`userId` namespace)
- Limpiar metadatos de usuario en IDB
- Limpiar stores sesión-scoped y diagnósticos
- Conservar stores globales reutilizables y sesión-scoped condicionales
- Si otro usuario inicia sesión en el mismo dispositivo: **limpieza completa del espacio auth-scoped anterior + stores condicionales**

#### B. Logout con cambios pendientes
Hay outbox pendiente, dead letters, conflictos sin resolver o sync bloqueado:
- Mostrar `ConfirmDialog` con:
  > "Hay cambios pendientes de sincronizar. Si cierras sesión ahora, podrías perder trabajo local no enviado al servidor."
- Opciones:
  1. **Cancelar** — volver, no cerrar sesión
  2. **Cerrar sesión y conservar datos** — mantener datos locales, solo limpiar tokens/sesión. Al volver a iniciar sesión el mismo usuario, retomar sync pendiente
  3. **Cerrar sesión y borrar todo** — limpieza completa del dispositivo

#### C. Expiración de sesión backend (server-session-expired)
No borrar datos locales. Solo bloquear sync. El usuario puede seguir leyendo y editando localmente.

#### D. Cambio de usuario en el mismo dispositivo
**Limpieza completa obligatoria** del espacio auth-scoped anterior. IDs de sesión, tokens, metadatos de usuario, caches nombradas por userId.

#### E. Política de invalidación de SW al logout
- Al logout del usuario actual → limpiar caches del SW que contengan datos de sesión (scoped por userId)
- No cachear páginas protegidas renderizadas en SW

#### F. Borrar todos los datos offline del dispositivo (acción manual)

Acción destructiva accesible desde StoragePanel que:
1. Muestra `ConfirmDialog` con impacto exacto:
   > "Esta acción eliminará todos los datos locales del dispositivo: catálogos, datos operativos, mapa offline, búsqueda geográfica y configuración local. No podrás usar la aplicación sin conexión hasta volver a descargar los datos."
2. Obliga a escribir "BORRAR" (o similar) para confirmar
3. Cierra sesión local
4. Limpia: todas las IDB stores, OPFS (mapa + temporales), SW caches, localStorage/sessionStorage relacionados
5. Recarga la aplicación al finalizar

### Estrategia de Validación de Datos

**Dos niveles de validación por chunk descargado:**

1. **Integridad de transporte**:
   - Checksum SHA-256 del chunk
   - JSON parse exitoso
   - Tamaño esperado
   - Número de elementos

2. **Integridad semántica**:
   - Schema validation por entidad crítica (basado en DTOs reales del backend, no supuestos)
   - Campos obligatorios presentes (usando nombres exactos del DTO — verificar con `ProductResponse.java`, `CustomerResponse.java`)
   - Tipos de datos correctos
   - Referencias mínimas (ej: `categoryId` existe en categories store)
   - Reglas de dominio básicas (ej: `standardCost >= 0`, no inventar `price` si el DTO real usa otro nombre)

Implementar con validadores TypeScript explícitos por DTO (no `any`, no Zod si preocupa bundle — usar validadores manuales en loader/sync).

### Política de Backpressure Global

| Recurso | Concurrencia máxima | Notas |
|---------|---------------------|-------|
| Descarga catálogos (chunked) | 2–3 | DownloadQueueService.MAX_CONCURRENT |
| Descarga blobs grandes (mapa) | 1 | Exclusivo — no ejecutar en paralelo con sync pesado |
| Sync push (outbox) | 1 | Por lote de 50 operaciones |
| Sync pull | 1 | Por entidad |
| Precarga imágenes (image_prefetch) | 2 | Thumbnails pequeños, suspende si `document.hidden` o batería baja |
| Precarga rutas (precache_routes) | 3 | Non-fatal, prioridad baja |
| Queries de usuario | N/A | Repos local, sin límite |
| Background en tab oculta | Suspender descargas + sync | `document.hidden` listener |
| Background con batería baja | Suspender solo blobs grandes | `navigator.getBattery()` si disponible (⚠️ deprecado en Chrome 109+ y removido de Firefox 131+. Envolver en `typeof navigator.getBattery === 'function'` + `try-catch`. Si no disponible, continuar sin suspender por batería.) |

### Coordinación de Scheduler Global

Las tablas de backpressure listan concurrencias máximas, pero no definen quién cede cuando dos procesos pesados coinciden (ej: map_tiles descargando PMTiles a OPFS mientras catalog sync escribe IDB).

**Reglas de coordinación:**

1. **Map download (`isMapDownloading` flag)**: Durante descarga de PMTiles a OPFS, `DownloadQueueService` Pausa automáticamente si un Zustand store compartido `{ isMapDownloading: boolean }` está en `true`. Esto evita que IO de IDB compita con IO de OPFS en el mismo contexto (main thread).

2. **Sync push bloquea sync pull**: Mientras `processOutbox()` está corriendo, no iniciar `pullEntity()` para ninguna entidad. Se serializan: primero push completo, luego pull.

3. **Prioridad de precarga**: `image_prefetch` y `precache_routes` ceden ante cualquier operación iniciada por el usuario (click, navegación, escritura). Implementar con `navigator.scheduling.isInputPending()` si disponible, o con un contador de `userActivity` que pausa precarga si hubo input en los últimos 100ms.

4. **Zustand store compartido `schedulerState`**:
   ```typescript
   interface SchedulerState {
     isMapDownloading: boolean;
     isSyncing: boolean;
     isPruning: boolean;
     userActivityAt: number;  // timestamp del último input de usuario
   }
   ```
   - `DownloadQueueService` y `SyncService` leen este store antes de iniciar operaciones pesadas.
   - No requiere un scheduler centralizado — los servicios cooperan leyendo el estado global. Cada servicio es responsable de chequear antes de arrancar una tarea nueva.
   - Si dos operaciones del mismo tipo intentan correr (ej: dos pulls simultáneos), `navigator.locks` las serializa (ver regla de locks multi-tab).

5. **Prioridad de scheduler (de mayor a menor) — quién cede cuando dos procesos colisionan**:

   | Prioridad | Proceso | Cede cuando | Notas |
   |-----------|---------|-------------|-------|
   | 1 (máxima) | Descarga inicial (boot) | Nunca | Bloquea hasta completar `stock`. Sin esto la app no arranca. |
   | 2 | Sync push (outbox crítico) | Solo si `isMapDownloading` | Tipo B se procesan antes que Tipo A. Push bloquea pull. |
   | 3 | Sync pull (delta) | Si push está corriendo o hay descarga inicial | Pull espera a que push termine. No bloquear descarga inicial. |
   | 4 | Map tiles download (OPFS) | Si hay sync push pendiente o descarga inicial | `isMapDownloading` flag en Zustand. Los demás procesos leen este flag y pausan. |
   | 5 | Image prefetch | Si `document.hidden`, batería baja, o cualquier operación de prioridad 1-4 activa | Cede inmediatamente. Concurrencia max 2. Suspende si hay input de usuario. |
   | 6 (mínima) | Precache routes | Siempre que otro proceso necesite el main thread | Non-fatal, sin impacto si falla. Último en ejecutarse. |

   **Regla práctica**: Cuando dos procesos de diferente prioridad colisionan, el de menor prioridad verifica `schedulerState` y pausa/reprograma. Cuando dos procesos de la misma prioridad colisionan, `navigator.locks` los serializa.

## Política de Mantenimiento Local del Dispositivo

### Pruning Automático Programado

Tarea de mantenimiento que se ejecuta en:
- Boot (`rehydrate_local`)
- Post-sync exitoso
- Cada 30 minutos si la app está abierta y activa
- Al detectar presión de cuota (`navigator.storage.estimate()` < 20% disponible)

**Operaciones:**
1. Purge de `appLogs` > 7 días (o > 5000 entradas)
2. Purge de `notifications` > 30 días
3. Purge de `sales`, `movements`, `returns`, `transfers` > 90 días
4. Purge de `purchases` > 180 días
5. Cleanup de `downloadChunks` committed/obsoletos (> 24h), filtrado por `userId` activo
6. Cleanup de archivos temporales OPFS (`*.tmp.*`)
7. Cleanup de caches SW viejas (versiones anteriores al deploy)
8. LRU eviction de `imageIndex` (blobs OPFS) si supera 100MB — eliminar entradas menos accedidas en `by-last-access`
9. Pruning rolling de `sales`, `movements`, `purchases`, `transfers`, `adjustments`, `returns` usando índices `by-sale-date`/`by-occurred-at` (comparación ISO8601 string, funciona porque es `YYYY-MM-DD`)

> ⚠️ **Condición para el pruning por comparación ISO8601**: El pruning compara strings `YYYY-MM-DD` contra el cutoff. Esto funciona SOLO si los campos `saleDate`, `occurredAt`, etc. están almacenados en IDB como **string ISO8601** (`"2026-01-15"`), no como `Date` object ni timestamp numérico. Si algún repo guarda fechas como `Date` o `number`, el pruning falla silenciosamente porque la comparación lexicográfica de strings no es equivalente a la numérica. **Verificar el formato real de cada campo en los repositorios locales antes de implementar pruning.** Si algún campo usa timestamp numérico, convertir a `number` en lugar de `string` y comparar con `< cutoffTimestamp`.

### Control de Crecimiento — Alarmas por Cuota

| Umbral disponible | Acción |
|------------------|--------|
| < 20% | Warning en `appLogger`, banner discreto "Almacenamiento casi lleno" |
| < 10% | Banner persistente amarillo + sugerencia de limpieza |
| < 5MB | Considerar fatal — `error` state (extremo, casi nunca ocurre en navegadores modernos) |

### Panel de Almacenamiento (UI) — Accesible para usuario final

Pantalla o modal accesible desde Settings con acciones seguras:

| Sección | Muestra |
|---------|---------|
| Uso total | Cuota usada / total estimada, estado de persistencia |
| Por store | Cantidad de registros por entidad, tamaño estimado |
| Mapa | Instalado? Versión, checksum, tamaño, fecha. Botón "Descargar" con progreso (barra + %), botón "Cancelar", estado "Descargando...". Al completar: checksum validado, metadata guardada |
| Logs debug | Cantidad de entradas, TTL restante |
| Image cache | Tamaño actual (OPFS), límite LRU 100MB, metadatos en IDB `imageIndex` |
| Outbox + Dead letters | Cantidad de operaciones pendientes |
| geoIndex | Versión, cantidad de entradas |

**Acciones manuales disponibles:**
- Limpiar logs debug
- Limpiar cache de imágenes
- Descargar / re-descargar mapa (con barra de progreso, cancelable, background)
  - Si ya existe, confirmar antes de sobrescribir: "El mapa ya está descargado. ¿Descargar de nuevo?"
- Reindexar geoIndex
- Limpiar catálogos y forzar resync completa
- Exportar diagnóstico (JSON)
- Verificar integridad del almacenamiento
- Borrar todos los datos offline del dispositivo (con confirmación)

### Panel de Salud (Health) — Admin/Dev only

Panel con detalles técnicos sensibles, accesible solo desde settings avanzados o modo debug (`?debug=1`):

| Métrica | Detalle |
|---------|---------|
| Cuota | Usada / estimada |
| Persistencia | Concedida o no |
| DB version | Número actual |
| Chunks fallidos | Cantidad + detalle |
| Dead letters | Cantidad |
| Outbox pendiente | Cantidad |
| Mapa | Instalado, checksum, versión |
| geoIndex | Versión, entidades |
| Última sync exitosa | Timestamp |
| Session state | `local-authenticated` / `backend-valid` / `expired` |
| Auditoría | Resultado de última auditoría de boot |

Acción: botón "Ejecutar diagnóstico local" que corre auditoría completa y muestra resultado en `Dialog`.

---

## Política de Reutilización de Componentes UI

### Principio
**La app debe crecer reutilizando primitives y componentes genéricos existentes siempre que sea posible.** Toda UI nueva debe inspeccionar `presentation/shared/components/ui/`, `presentation/shared/components/feedback/`, y `presentation/shared/components/layout/` antes de implementar.

### Prioridad de reutilización
Revisar en este orden:

1. **Feedback**: Toast, TooltipHint, TooltipWrapper, Dialog, AlertDialog, Banner, InlineAlert, Badge, StatusPill, Skeleton, Spinner, Progress, EmptyState, ErrorState, ConfirmDialog
2. **Formularios**: Input, ComboboxSelect, Textarea, DatePicker, Switch, RadioGroup
3. **Datos**: GenericTable, Card, ListItem, DataRow, Pagination
4. **Layout**: PageHeader, Panel, Section, Grid, Stack, Container, Tabs, Accordion
5. **Navegación**: Sidebar, NavLink, Breadcrumbs, CommandPalette

### Reglas
- Si existe un componente reusable que cubre el 80–90% del caso, **se reutiliza y se extiende con props**. No duplicar variantes visuales equivalentes.
- Los nuevos componentes deben componerse sobre primitives existentes, no reemplazarlas con una nueva implementación paralela.
- Las excepciones se documentan con comentario inline explicando por qué el genérico no aplica.

---

## Clasificación de Errores

### TypeScript error kind (definir en `src/core/errors/types.ts`)

```typescript
export type AppErrorKind =
  | 'network'                // fetch falló, timeout, offline
  | 'auth'                   // token expirado, refresh falló, 401/403
  | 'session-expired-sync'   // sesión local activa, sync bloqueado por refresh expirado
  | 'conflict'               // optimistic locking reject (version mismatch)
  | 'validation'             // DTO validation falló en chunk
  | 'corruption'             // SHA-256 mismatch, JSON parse error
  | 'quota'                  // storage.estimate() insuficiente
  | 'map-download'           // PMTiles download/OPFS falló
  | 'storage'                // IDB open/write/read falló
  | 'outbox-full'            // outbox alcanzó MAX_OUTBOX=500, escrituras bloqueadas
  | 'unexpected';            // catch-all, error sin clasificar
```

### Auditoría Crítica vs Diagnóstica

| Tipo | Subtipo | Qué incluye | Impacta `ready_partial`? | Canal UX |
|------|---------|-------------|-------------------------|----------|
| **Crítica irrecuperable** | — | IDB no abre, schema incompatible, cuota imposible, no hay cache mínima y descarga es imposible | Sí — bloquea boot | `ErrorState` bloqueante sin acción de recuperación automática |
| **Crítica recuperable** | — | Core dataset corrupto pero usuario puede "Reconstruir almacenamiento local", estructura dañada reseteable | Sí — bloquea boot pero ofrece acción | `ErrorState` con acciones: "Reintentar", "Reconstruir almacenamiento", "Borrar datos y volver a descargar" |
| **Diagnóstica** | — | Índice secundario faltante, checksum mapa falló, catálogo secundario stale, métrica de integridad no cuadra pero cache utilizable | No — solo degrada a `degraded` | `Banner` + log + badge sync |

### Error a Mitad de Carga por Tipo de Arranque

| Escenario | Core dataset existe? | Error en entidad crítica | Error en recurso secundario |
|-----------|---------------------|------------------------|----------------------------|
| **Primer arranque** (sin cache) | No | **Fatal** — bloquea boot (`error`) | Non-fatal — degrada a `degraded` |
| **Arranque con cache** (rehydrate_local) | Sí | Non-fatal — pasa a `ready_partial`/`degraded`, refresh queda pendiente | Non-fatal — solo degrada, sin bloquear |

Si la app ya alcanzó `ready_partial`, cualquier error posterior en carga de recursos secundarios o refresh incremental es **non-fatal** y solo degrada `availability` a `degraded`. Si aún no existe core dataset suficiente en IDB, los errores en entidades críticas (`warehouses`, `products`, `stockBalances`) son **fatales de boot**.

### Reanudación de Carga Interrumpida (Resume Semantics)

`downloadChunks` store actúa como journal de checkpoint por chunk:

| Estado del chunk | Acción en rehydrate_local |
|-----------------|--------------------------|
| `committed` | Conservar — no repetir |
| `downloading` (huérfano) | Marcar como `pending` y reintentar |
| `failed` | Retry con contador (1s → 5s → 15s, max 3) |
| `corrupted` | No reintentar automático infinito — enviar a `corruptionQueue` y `CorruptionRepairCenter` |

Si el core dataset mínimo ya existe en IDB (evaluado en `rehydrate_local`), la app entra en `ready_partial` aunque chunks de refresco hayan quedado incompletos o huérfanos. Los chunks fallidos se reintentan en background.

### Política de Migración IndexedDB Multi-Tab

Al detectar `DB_VERSION` nueva:
1. OpenDB intenta upgrade normal
2. Si otra pestaña mantiene conexión → `blocked` event:
   - Mostrar banner/toast: "Otra pestaña tiene una versión antigua. Recarga las otras pestañas para continuar."
   - No bloquear UI permanentemente — ofrecer "Ignorar y continuar con datos locales" como fallback
3. Al recibir `versionchange` desde otra pestaña:
   - Cerrar todas las conexiones a IDB inmediatamente
   - Forzar reload controlado de la pestaña si es necesario
4. No dejar la app en estado ambiguo sin DB operativa

### Auditorías Obligatorias de Boot

| Auditoría | Tipo | Momento | Acción si falla |
|-----------|------|---------|-----------------|
| IDB open + schema version | crítica | `db_open` | `error` — app no puede iniciar |
| Core dataset sufficiency | crítica | `rehydrate_local` | Continuar descarga completa |
| Chunk journal consistency | diagnóstica | `rehydrate_local` | Reparar/reintentar según política de resume |
| SW registration state | diagnóstica | `sw_precache` | Continuar sin precache |
| OPFS availability | diagnóstica | `map_tiles` | `degraded` — mapa offline |
| geoIndex integrity | diagnóstica | post-`ready_partial` (carga separada) | `degraded` — geocoder offline |
| Token/server session refresh | diagnóstica (lectura), crítica (sync) | reconnect | Mantener lectura local, bloquear sync, banner persistente |

### Formato de Mensajes de Error UI

Cada error mostrado al usuario debe incluir, según aplique:
1. **qué pasó**
2. **qué impacto tiene** (o no tiene)
3. **qué puede hacer el usuario**
4. **si habrá retry automático o no**

**Buenos ejemplos:**
- "No se pudo descargar el catálogo de productos. La app seguirá usando los datos locales guardados. Reintentaremos automáticamente cuando haya conexión."
- "No se pudo abrir el almacenamiento local del navegador. La aplicación no puede iniciarse. Recarga la página o revisa si el navegador bloquea el almacenamiento del sitio."
- "Tu sesión con el servidor expiró. Puedes seguir viendo los datos locales, pero debes iniciar sesión para sincronizar cambios."

### Códigos de error para soporte

Todo error capturado debe incluir un `errorCode` visible en detalles expandibles o logs exportables:

| Código | Significado |
|--------|-------------|
| `ERR_IDB_OPEN_FAILED` | IndexedDB no pudo abrirse |
| `ERR_IDB_VERSION_BLOCKED` | Upgrade bloqueado por otra pestaña |
| `ERR_MAP_PMTILES_DOWNLOAD` | Descarga de mapa falló |
| `ERR_MAP_CHECKSUM_MISMATCH` | Checksum del PMTiles no coincide |
| `ERR_SYNC_CONFLICT_VERSION` | Conflicto de versión en sync |
| `ERR_GEOINDEX_LOAD_FAILED` | Carga del índice geográfico falló |
| `ERR_AUTH_REFRESH_FAILED` | Refresh token expiró / revocado |
| `ERR_QUOTA_INSUFFICIENT` | Cuota de almacenamiento insuficiente |
| `ERR_CORRUPTION_UNREPAIRABLE` | Dato corrupto no pudo repararse |

### Matriz de respuesta por error

| AppErrorKind | Severidad | Canal UX | Retry? | Degrada availability? | Log en appLogger? |
|---|---|---|---|---|---|
| network | non-fatal | toast + inline alert | automático (3 intentos) | sí (degraded si persistente) | error |
| auth | fatal | pantalla login | refresh token automático | sí (error) | error |
| session-expired-sync | non-fatal | banner persistente "Sesión expirada para sync" | login manual para reanudar sync | sí (degraded, sync bloqueado) | warn |
| conflict | non-fatal | centro incidentes + toast | manual (editar/descartar) | no | warn |
| validation | non-fatal | CorruptionRepairCenter + toast | sí (reparar y reintentar) | no | warn |
| corruption | non-fatal | CorruptionRepairCenter + toast | sí (3 intentos, luego quarantine) | no | error |
| quota | fatal | error state bloqueante | no | sí (error) | error |
| map-download | non-fatal | banner degradado + enlace Settings | manual desde StoragePanel | sí (degraded) | warn |
| outbox-full | non-fatal | InlineAlert persistente "Cola de cambios llena" | conectar y sync automático; botón "Ir a sincronización" | no | warn |
| storage | fatal | error state bloqueante | recargar app | sí (error) | error |
| unexpected | fatal | error state bloqueante | recargar app | sí (error) | error |

### Respuesta Visual por Fase/Error

| Fase | Error | Impacto | UI exacta | Acción usuario | Retry automático |
|------|-------|---------|-----------|----------------|------------------|
| `quota` | Cuota baja (> 5MB) | No fatal | Banner warning + opción ir a StoragePanel | Abrir StoragePanel | No |
| `quota` | Cuota imposible (< 5MB) | Fatal | `ErrorState`: "Almacenamiento insuficiente" + botón limpiar/reintentar | Reintentar / limpiar almacenamiento | No |
| `db_open` | IDB no abre / schema incompatible | Fatal | `ErrorState`: "Error al abrir almacenamiento local" + botón reintentar + ayuda | Reintentar / recargar | No |
| `rehydrate_local` | Journal corrupto, core dataset existe | No fatal | Banner + log interno. Pasa a `ready_partial` | Ver diagnóstico | Sí (reintenta chunks fallidos) |
| `rehydrate_local` | Journal corrupto, sin core dataset | Fatal | `ErrorState`: "No se pudieron restaurar datos locales" + reintentar | Reintentar | Sí antes de fallar |
| `warehouses/products/stock` sin core | Error de descarga | Fatal | `ErrorState`: "Error descargando {entidad}" + botón reintentar + detalles | Reintentar / ver diagnóstico | Sí (3 intentos) |
| `warehouses/products/stock` con core | Error de refresh | Degradado | Banner amarillo: "Actualización de {entidad} falló. Usando datos anteriores." + botón reintentar | Continuar / reintentar | Sí (3 intentos) |
| `map_tiles` | OPFS/checksum falló | Degradado | `MapStatusOverlay` "Mapa no disponible" + banner + enlace a Settings | Ir a Configuración → StoragePanel | No (manual desde Settings) |
| `geoIndex` | Carga falló | Degradado | Búsqueda deshabilitada + banner "Búsqueda offline no disponible" | Reindexar / reintentar | Manual |
| `precache_routes` | Shell route fetch falló | Casi sin impacto | No toast visible. Solo `appLogger.warn` | Ninguna | No |
| Auth reconnect | Refresh falla | Degradado | Banner persistente "Sesión expirada" + botón "Iniciar sesión" | Iniciar sesión / seguir local | No |
| `blocked` IDB | Otra pestaña bloquea upgrade | Potencial fatal | Banner/dialog: "Otra pestaña bloquea actualización. Recarga las otras pestañas." | Recargar pestañas | No |

---

## Política de Feedback UI

| Evento | Componente/UI preferido | Notas |
|--------|------------------------|-------|
| Éxito breve (guardar, sync, acción) | Toast | Auto-dismiss 3s |
| Error recuperable | Toast + InlineAlert | Toast para notificar, InlineAlert persistente si requiere acción |
| Error fatal | ErrorState (pantalla bloqueante) | Botón reintentar o recargar |
| Proceso largo (>1s) | ProgressBar o Skeleton contextual | Mostrar fase actual + sub-paso |
| Estado degradado | Banner persistente (amarillo) | Sin auto-dismiss. Opción "Ver detalles" |
| Conflicto de sync | SyncIncidentsView + badge nav + Toast | Badge en icono de sync con conteo |
| Chunk corrupto | CorruptionRepairCenter + Toast warning | Toast dirige al RepairCenter |
| Acción destructiva | ConfirmDialog | Requiere confirmación explícita |
| Sin datos | EmptyState reusable | Con icono + mensaje + acción opcional |

### Reglas
- Un toast no reemplaza un estado persistente cuando el usuario necesita actuar después.
- Errores críticos NO deben comunicarse solo con toast — deben dejar un estado visible.
- Las acciones de reparación deben estar acompañadas por tooltip + texto claro.
- El canal UX se define por `AppErrorKind` en el momento de capturar el error, no se decide después.
- **Todo flujo nuevo debe usar toast existente para éxito/aviso breve e `InlineAlert`/`Banner`/`ErrorState` existentes para estados persistentes.** No crear canales UX paralelos.

---

## Contrato UI por `AppAvailability`

| availability | Respuesta UI | Componente/s mutados |
|---|---|---|
| `blocking` | Fullscreen loader con barra de progreso + fase actual + sub-paso | `CacheProgressBar` ocupa pantalla completa. Todo el contenido detrás oculto. |
| `ready_partial` | Layout principal visible + banner informativo "Descargando recursos secundarios..." (auto-dismiss al completar) | `DashboardLayout` visible. `CacheProgressBar` colapsado a banner superior. Badge de progreso en icono de sync. |
| `ready_complete` | App usable sin bloqueo. Sin banner. Estado "Todo listo". | `CacheProgressBar` oculto o badge discreto. |
| `degraded` | Layout visible + banner amarillo persistente "App funcionando con algunas limitaciones" + detalle expandible + botón reintentar si aplica | `CacheProgressBar` muestra detalle de qué falló. Módulos afectados (mapa, búsqueda) muestran fallback visual + tooltip explicativo. |
| `error` | Pantalla de error bloqueante con icono + mensaje + botón reintentar. Sin layout visible. | `ErrorState` reemplaza todo el contenido. Botón "Reintentar" reinicia `startLoading()`. |

### Fallback visual por módulo
- **Mapa** si no está descargado: mostrar `MapStatusOverlay` "Mapa no disponible. Descargar desde Configuración" con enlace a StoragePanel. No bloquear el resto de la app.
- **Búsqueda geográfica** si `geoIndex` falló: el mapa sigue renderizando, la búsqueda muestra "Búsqueda no disponible offline".
- **precache_routes** si falló: no mostrar error al usuario. Solo log interno.

---

## Accesibilidad y Consistencia

- Reutilizar componentes accesibles existentes. No crear nuevas interacciones sin soporte keyboard/focus.
- Todo icon button debe tener `aria-label` descriptivo.
- Foco visible obligatorio en todos los elementos interactivos (nunca `outline: none` sin alternativa).
- Estados `loading`, `disabled`, `error`, `success` deben ser visualmente distinguibles (color + icono + texto, no solo color).
- Toasts no deben ser el único canal para errores importantes — dejar estado persistente visible.
- Tooltips complementan labels, no los reemplazan para información crítica de formularios.
- Mantener targets táctiles `min-h-11` / `min-w-11` en todos los elementos interactivos.
- Contraste adecuado: ratio ≥4.5:1 para texto normal, ≥3:1 para texto grande.
- Los mensajes de error deben ser claros y accionables, no solo "Ocurrió un error".

---

## Matriz de Estrategia por Entidad

| Entidad | Estrategia local | Descarga inicial | Sync posterior | Retención local |
|---------|-----------------|-----------------|----------------|-----------------|
| products | full | completa (chunked, validada) | delta | persistente |
| categories | full | completa | delta | persistente |
| warehouses | full | completa | delta | persistente |
| customers | full | completa | delta | persistente |
| suppliers | full | completa | delta | persistente |
| stockBalances | snapshot completo | completa | delta/snapshot | persistente |
| currencies | full | completa | delta | persistente |
| exchangeRates | full | completa | delta | persistente |
| sales | parcial | últimos 90 días | delta + paginado | 90 días rolling |
| purchases | parcial | últimos 180 días | delta + paginado | 180 días rolling |
| movements | parcial | últimos 90 días | delta + paginado | 90 días rolling |
| transfers | parcial | últimos 90 días | delta + paginado | 90 días rolling |
| adjustments | parcial | últimos 90 días | delta + paginado | 90 días rolling |
| returns | parcial | últimos 90 días | delta + paginado | 90 días rolling |
| notifications | parcial | recientes (50) | delta | 30 días |
| customerDebts | snapshot | completa | delta/snapshot | persistente |
| audit-log | no full | on-demand | paginado (no precargar) | no persistir completo |
| imageCache | on-demand | lazy | bajo demanda | OPFS (100MB max, metadatos en IDB `imageIndex`) |
| deadLetter | completa (pequeño) | completa | N/A | hasta resolución manual |
| outbox | completa (pequeño) | N/A | N/A | hasta sync exitoso |
| geoIndex | full (Cuba) | completa desde backend endpoints `/api/v1/geo/provinces?countryCode=CU` + `/api/v1/geo/municipalities/{provinceId}` (15 provincias + ~170 municipios) | N/A (se descarga una vez) | persistente |

### Suficiencia Mínima de Cache por Módulo

Para determinar `ready_partial`, la app evalúa si existen localmente y son válidos:

| Módulo | Datos mínimos requeridos |
|--------|--------------------------|
| Dashboard | warehouses, products, stockBalances |
| Products | products, categories |
| Sales | products, customers, stockBalances |
| Purchases | products, suppliers, warehouses |
| Stock | warehouses, stockBalances |
| Reports | products, stockBalances |

La app entra en `ready_partial` si el **core dataset** (warehouses + products + stockBalances) existe en IDB y no está vacío. Al menos 1 warehouse, 1 producto y 1 registro de stock son suficientes para que la UI sea funcional. categories NO bloquea `ready_partial` — sin categorías los productos siguen siendo funcionales.

### Política de Retención y Pruning por Store

| Store | Estrategia | Control automático | Trigger pruning |
|-------|-----------|-------------------|-----------------|
| `products`, `categories`, `warehouses`, `customers`, `suppliers`, `stockBalances` | Persistente (nunca se borra automáticamente) | Ninguno — solo resync manual o cambio de usuario | — |
| `currencies`, `exchangeRates`, `customerDebts` | Persistente | Ninguno | — |
| `sales` | Rolling 90 días | Purga registros > 90 días en cada prune | Boot, post-sync, cuota < 20% |
| `purchases` | Rolling 180 días | Purga registros > 180 días | Boot, post-sync, cuota < 20% |
| `movements` | Rolling 90 días | Purga registros > 90 días | Boot, post-sync, cuota < 20% |
| `transfers` | Rolling 90 días | Purga registros > 90 días | Boot, post-sync, cuota < 20% |
| `adjustments` | Rolling 90 días | Purga registros > 90 días | Boot, post-sync, cuota < 20% |
| `returns` | Rolling 90 días | Purga registros > 90 días | Boot, post-sync, cuota < 20% |
| `notifications` | TTL 30 días | Purga > 30 días | Boot, post-sync |
| `appLogs` | TTL 7 días + cap 5000 | Purga > 7 días + max enforcement | Cada flush, boot |
| `imageIndex` (metadatos, blobs en OPFS) | LRU 100MB | Evicción LRU por `lastAccessedAt` cuando supera 100MB | Cada escritura, prune programado |
| `geoIndex` | Fijo versionado | Nunca se purga automáticamente | Solo por reindexación manual |
| `map-pmtiles` | Una versión activa + temporal | Cleanup de temporales en boot | Boot, post-descarga |
| `corruptionQueue` | Hasta resolución manual o 30 días | Purga entradas resueltas > 30 días | Prune programado |
| `deadLetter` | Hasta resolución manual | Sin purge automático | — |
| `outbox` | Hasta sync exitoso | Sin purge automático | — |
| `downloadChunks` | Hasta cleanup post-sync | Purga committed/obsoletos > 24h | Boot, post-sync |
| `audit-log` | No persistir completo | Sin purge (on-demand) | — |

> ⚠️ **Guard de formato antes de pruning por fecha**: El pruning por ISO8601 (reglas 1–9 del pruning automático) compara strings `YYYY-MM-DD`. **Antes de ejecutar cualquier pruning, verificar que el formato del campo sea string ISO8601**. Si el campo está almacenado como `Date` object o timestamp numérico, el pruning falla silenciosamente.
>
> ```typescript
> // En MaintenanceService.ts:
> async function runDatePruning<T extends Record<string, unknown>>(
>   db: IDBPDatabase,
>   storeName: string,
>   cutoffDate: string,
>   fieldName: string
> ): Promise<number> {
>   // 1. Verificar formato de un sample antes de ejecutar
>   const sample = await db.getAll(storeName, undefined, 1);
>   if (sample.length > 0) {
>     const value = sample[0][fieldName];
>     if (typeof value !== 'string') {
>       appLogger.warn(
>         `[Pruning] ${storeName}.${fieldName} no es ISO string (${typeof value}) ` +
>         `— skipping date pruning. Formato esperado: string ISO8601 ("2026-01-15"). ` +
>         `Valor real: ${JSON.stringify(value)}`
>       );
>       return 0; // No ejecutar pruning incorrecto
>     }
>     // Verificar que coincida con patrón ISO8601 fecha
>     if (!/^\d{4}-\d{2}-\d{2}/.test(value)) {
>       appLogger.warn(`[Pruning] ${storeName}.${fieldName} no es ISO8601: "${value}" — skipping`);
>       return 0;
>     }
>   }
>
>   // 2. Ejecutar pruning con comparación lexicográfica (segura solo si es string ISO)
>   let purged = 0;
>   let cursor = await db.transaction(storeName).store.index(`by-${fieldName}`).openCursor();
>   while (cursor) {
>     if (cursor.value[fieldName] < cutoffDate) {
>       await cursor.delete();
>       purged++;
>     }
>     cursor = await cursor.continue();
>   }
>
>   appLogger.info(`[Pruning] ${storeName}: purged ${purged} registros anteriores a ${cutoffDate}`);
>   return purged;
> }
> ```
>
> Aplicar a: `sales.by-sale-date`, `movements.by-occurred-at`, `purchases.by-occurred-at`, `transfers.by-occurred-at`, `adjustments.by-occurred-at`, `returns.by-occurred-at`.

### Comportamiento de error según disponibilidad de cache

- **Primer arranque (sin core dataset)**: errores en `warehouses`, `products`, `stockBalances` son **fatales** — la app no puede funcionar sin datos mínimos. Pasa a `error`.
- **Arranque con cache (core dataset existe)**: errores en entidades críticas son **non-fatal** — la app entra en `ready_partial` con los datos existentes y el refresh queda pendiente (se reintenta en background). Solo degrada `availability` a `degraded`.

---

## Estados del Loader (separados)

```typescript
// Fase técnica del proceso de boot
// ⚠️ image_prefetch NO es fase del loader — es tarea de background que corre
// después de ready_partial con concurrencia 2 y prioridad baja. No bloquea UI.
type LoadPhase =
  | 'idle'
  | 'quota'
  | 'sw_precache'
  | 'db_open'              // IDB upgrade + migration (sin geoIndex — se carga post-ready_partial)
  | 'rehydrate_local'     // medir suficiencia de cache local
  | 'warehouses'
  | 'products'                      // antes de stock porque stock depende de productos
  | 'categories'
  | 'currencies'                    // catálogos secundarios (no bloquean ready_partial)
  | 'exchange_rates'
  | 'customer_debts'
  | 'stock'
  | 'customers'
  | 'suppliers'
  | 'map_tiles'
  | 'precache_routes';

// Estado funcional para la UI
type AppAvailability =
  | 'blocking'       // carga inicial, app no usable
  | 'ready_partial'  // core dataset listo, app usable
  | 'ready_complete' // todo descargado
  | 'degraded'       // errores no fatales (mapa, precache)
  | 'error';         // error fatal
```

### Diagrama de flujo

```
idle → quota → sw_precache → db_open ─── (geoIndex se carga post-ready_partial)
  │                                  └── → rehydrate_local
  │
  ├─ [cache suficiente] → ready_partial
  │     └─ en paralelo: warehouses → products → categories → ...
  │
      └─ [sin cache / cache insuficiente] → blocking

            ┌─ [core] ───────────────────────── [background, no bloquean ready_partial] ─┐
            │ warehouses → products → stock     categories → currencies → exchange_rates │
            │         ↓                         → customer_debts → customers → suppliers │
            │    ready_partial ◄───────────────────────────────────────────────────────────┘
            │         ↓
            │         ├─ image_prefetch ──── background task, concurrencia 2, suspende si hidden/batería baja
            │         ├─ map_tiles ───────── solo verificación checksum (non-fatal)
            │         └─ precache_routes ─── shell routes (credentials: 'omit'), non-fatal
            │         └─ ready_complete ◄─── ambas deben terminar (background counter 0→2)
```

### Detalle de fase `quota`

1. Ejecutar `navigator.storage.estimate()` para determinar cuota disponible
2. Intentar `navigator.storage.persist()` como **optimización de durabilidad**
3. Si `persist()` falla o devuelve `false`:
   - **Seguir cargando igual** — no bloquear
   - Mostrar warning discreto en `appLogger.warn`
   - Marcar riesgo de evicción (best-effort storage)
4. Si `estimate()` muestra cuota insuficiente para operar (< 50MB disponibles), emitir alerta no bloqueante
5. Si cuota es imposible (< 5MB), recién ahí considerar fatal — pero es extremadamente raro en navegadores modernos

> `navigator.storage.persist()` es **best-effort y non-fatal**. Si no se concede persistencia, la app continúa usando almacenamiento normal del origen y registra advertencia en `appLogger`. La diferencia entre best-effort y persistent storage es la probabilidad de evicción bajo presión de espacio, no la funcionalidad.

> ⚠️ **`navigator.storage.estimate()` es aproximado, especialmente en Safari**. En Safari iOS/desktop, `estimate()` puede reportar valores significativamente inexactos:
> - No refleja el espacio usado por OPFS (archivos grandes como PMTiles no cuentan en el quota reportado)
> - El límite total reportado puede ser un límite del origen, no del dispositivo
> - En algunos casos reporta menos espacio del realmente disponible
>
> **Implicaciones para el plan**:
> - Las alarmas de cuota (banner < 20%, persistente < 10%, fatal < 5MB) son **orientativas, no exactas**
> - El banner < 10% no debe ser alarmista si la app funciona correctamente
> - La métrica de cuota en HealthPanel debe incluir disclaimer: "Aproximado — Safari puede no reflejar OPFS"
> - Si `estimate()` reporta < 5MB pero la app opera sin errores, no forzar error state — solo warning
> - **Verificar comportamiento real en Safari antes de ajustar umbrales definitivos** (fase F)

---

## Política de Conflictos por Tipo de Entidad

| Entidad | Política de conflicto | Acción de usuario |
|---------|----------------------|-------------------|
| products | optimistic lock reject (version) | editar / descartar / overwrite admin |
| customers | optimistic lock reject (version) | editar / descartar |
| suppliers | optimistic lock reject (version) | editar / descartar |
| categories | optimistic lock reject (version) | editar / descartar |
| warehouses | optimistic lock reject (version) | editar / descartar |
| stockBalances | no editable directo | recalcular desde movimientos (merge automático) |
| sales DRAFT | reject | editar / reintentar |
| sales CONFIRMED | no overwrite | incidente obligatorio (audit) |
| sales DELIVERED | no overwrite | incidente obligatorio (audit) |
| inventory movements | append-only | nunca merge manual |
| transfers | last-writer-wins con versión | solo si conflicto de estado |
| adjustments | last-writer-wins con versión | solo si conflicto de estado |

Política general:
- **NUNCA merge silencioso** de datos editables.
- **Siempre** usar optimistic locking con `version`.
- Si `clientVersion !== serverVersion` → rechazar → entrar a flujo de resolución.
- El segundo usuario en escribir siempre ve el diff y decide.

---

## Budgets de Rendimiento

| Métrica | Objetivo | Cómo se mide |
|---------|----------|--------------|
| Cold start con cache local | < 2s en desktop medio | `performance.now()` desde `startLoading()` hasta `ready_partial` |
| Warm start con cache local | < 1s | Ídem, segunda carga |
| ready_partial en primer arranque (sin cache) | < 10s en red normal | Desde login hasta `ready_partial` |
| Consumo RAM durante map download | Sin buffer completo en memoria | DevTools Memory, verificar que no haya un `Uint8Array(total)` |
| Tiempo de verificación SHA-256 post-descarga | < 3s para 200MB en main thread | `performance.now()` post-descarga. Si > 3s en gama baja, mover a Web Worker |
| Tiempo de búsqueda local (geo-index) | < 100ms para top 5 | `console.time('geo-search')` (dev only) |
| Tamaño máximo geo-index Cuba inicial | < 500KB | `JSON.stringify(geoEntries).length` |
| Tamaño máximo logs IDB | 5000 entradas (≈ 2MB) | `db.count('appLogs')` |
| Máximo operaciones outbox | 500 | `db.count('outbox')` |
| Concurrencia descarga catálogos | 2–3 | DownloadQueueService.MAX_CONCURRENT |
| Concurrencia blobs grandes | 1 | Scheduler global |
| Tiempo de sincronización (pull) | < 5s por entidad | `console.time` |

---

## Progreso

| Fase | Nombre | Estado |
|------|--------|--------|
| **A** | Fundaciones offline — IDB v5 + store refactor + appLogger + fix endpoint | ❌ Pendiente |
| **B** | Integridad de descarga — DownloadQueueService + validación DTO | ❌ Pendiente |
| **C** | Loader robusto — phase/availability split + rehydrate_local + map_tiles + precache_routes + backgroundTasksStore | ❌ Pendiente |
| **D** | Sync/conflictos — serverPayload + FieldDiffTable + políticas + outbox lock + BroadcastChannel token | ❌ Pendiente |
| **E** | Mapa/GPS — MapLibre + PMTiles + streaming OPFS + geolocation + geo-index acotado + FileSystemResource | ❌ Pendiente |
| **F** | Verificación end-to-end | ❌ Pendiente |
| **G** | Estrategia de imágenes offline — OPFS + imageIndex + useImageCache + OfflineImage + backend | ❌ Pendiente |
| **H** | Doc & Code Cleanup — eliminar código/documentación muerta, consolidar docs/ y docs_dev/, actualizar README | ❌ Pendiente |
| **I** | Mantenimiento local — MaintenanceService + pruning automático + alarmas cuota | ❌ Pendiente |
| **I** | Mantenimiento local — MaintenanceService + pruning automático + alarmas cuota | ❌ Pendiente |

---

## Diagnóstico del Codebase

### Bug confirmado: Endpoint de productos incorrecto

`fetchPaginated` en `useAppLoader.ts:132` llama a `/api/v1/products?page=0&size=200`. Backend `GET /api/v1/products` es cursor-based (retorna `{items, nextCursor}`). El frontend espera `{content, totalPages}` del endpoint offset-based `GET /api/v1/products/paginated`. **Nunca se cachean productos en IDB.**

### Hallazgos clave del codebase audit (v3)

| Aspecto | Estado actual | Corrección definitiva |
|---------|---------------|----------------------|
| **IDB version** | 4 (v4), 20 stores, 22 índices | Subir a v5 con índices compuestos selectivos + stores `corruptionQueue` + `downloadChunks` + `appLogs` + `geoIndex` |
| **totalSteps** | Nunca se lee en UI (solo en initialState) | **Eliminar completamente** |
| **Mapa** | Leaflet + react-leaflet + pmtiles v4.4.1 + leaflet.vectorgrid | **Migrar a MapLibre GL JS** con PMTiles nativo. Leaflet como fallback temporal con criterio de retiro. |
| **Conflict UI** | SyncConflictResolver, DeadLetterList, SyncIncidentsView. Sin field-by-field diff. | **Solo añadir field-by-field diff** a SyncConflictResolver |
| **PushResultDto** | 5 campos, sin serverPayload | Añadir serverPayload |
| **STATIC_PAGES** | 29 rutas en serwist/route.ts | Reutilizar solo las 6 shell routes (evitar HTML con datos sensibles) |
| **GPS** | MapControls.tsx con `mapInstance.locate()` | useGeolocation hook + integrar en MapControls |
| **console.error** | 12 en 5 archivos | Reemplazar con appLogger |
| **next.config.ts** | Headers seguridad + SW | Agregar Accept-Ranges para PMTiles |
| **pmtiles dependency** | Ya instalado (^4.4.1) | Facilita migración a MapLibre |
| **Lectura actual** | `fetchPaginated`/`fetchAll` guardan en IDB pero usan HTTP como fuente | Migrar a local-first: TanStack Query lee de repos locales IDB |

### Verificación de dependencias con el codebase (2026-06-04)

La siguiente tabla verifica qué archivos/hooks/componentes mencionados en el plan EXISTEN realmente en el codebase vs necesitan crearse. Útil antes de cada fase para evitar sorpresas:

| Item del plan | ¿Existe? | Ruta real / Notas |
|---|---|---|
| `appLoaderStore.ts` | ✅ Existe | `src/core/loading/appLoaderStore.ts` — requiere separación phase/availability |
| `useAppLoader.ts` | ✅ Existe | `src/presentation/shared/hooks/storage/useAppLoader.ts` — requiere fix endpoint |
| `db.ts` (IDB) | ✅ Existe | `src/infrastructure/storage/db.ts` — DB_VERSION=4, upgrade a v5 |
| SW `sw.ts` (serwist) | ✅ Existe | `src/app/sw.ts` — `skipWaiting: true`, cambiar a `false` |
| `useAuthStore.ts` | ✅ Existe | `src/presentation/shared/hooks/storage/useAuthStore.ts` — 5 console.error |
| `useSyncStatus.ts` | ✅ Existe | Ya maneja background refresh con interval + network health |
| `SyncConflictResolver.tsx` | ✅ Existe | Usa `<pre>` blocks — requiere FieldDiffTable |
| `NotificationPanel.tsx` | ✅ Existe | 1 console.error en línea 37 |
| `PreferencesPanel.tsx` | ✅ Existe | 1 console.error |
| `DashboardRepository.ts` | ✅ Existe | Usa HTTP directo — migrar a cómputo local IDB |
| `DashboardMetricsRepository.ts` | ✅ Existe | Usa HTTP directo — migrar a cómputo local IDB |
| `CustomerRepository.ts` | ✅ Existe | **NO** se llama `localCustomerRepository.ts`. Usa `create()`/`update()`, NO `put()`. Sin `nameLower` |
| `GeoRegionRepository.ts` (frontend) | ✅ Existe | `src/infrastructure/repositories/geo/GeoRegionRepository.ts` — llama a `/api/v1/geo/*` |
| `GEO_REGIONS` backend | ✅ Existe | Controller en `/api/v1/geo/` (NO `/api/v1/geo-regions`) |
| `CacheProgressBar.tsx` | ✅ Existe | Requiere adaptación a phase/availability split |
| `MapControls.tsx` | ✅ Existe | Usa `mapInstance.locate()` — migrar a useGeolocation |
| **Nuevos a crear en el plan** | | |
| `backgroundTasksStore.ts` | ❌ No existe | Crear en `src/core/loading/backgroundTasksStore.ts` |
| `DownloadQueueService.ts` | ❌ No existe | Crear en `src/infrastructure/storage/DownloadQueueService.ts` |
| `CorruptionRepairCenter.tsx` | ❌ No existe | Crear en `presentation/shared/components/data-repair/` |
| `AppLogViewer.tsx` | ❌ No existe | Crear en `presentation/shared/components/debug/` |
| `HealthPanel.tsx` | ❌ No existe | Crear en `presentation/shared/components/storage/` |
| `StoragePanel.tsx` | ❌ No existe | Crear en Fase E |
| `useGeoSearch.ts` | ❌ No existe | Crear — solo existen `useProvinces.ts`/`useMunicipalities.ts` |
| `CurrentLocationBtn.tsx` | ❌ No existe | Crear |
| `ShareLocationBtn.tsx` | ❌ No existe | Crear |
| `MapPreview.tsx` | ❌ No existe | Crear con `dynamic({ ssr: false })` |
| `MapViewer.tsx` | ❌ No existe | Crear con `dynamic({ ssr: false })` |
| `OfflineImage.tsx` | ❌ No existe | Crear con prop `size` (thumbnail/preview/full) |
| `useImageCache.ts` | ❌ No existe | Crear — auto-revoke ObjectURLs |
| `ImageResolver.ts` | ❌ No existe | Crear — traduce URL API → ObjectURL OPFS |
| `MaintenanceService.ts` | ❌ No existe | Crear en Fase I |
| `SyncIncidentView.tsx` | ✅ Existe | Ya renderiza incidentes |
| `FieldDiffTable.tsx` | ❌ No existe | Crear e integrar en SyncConflictResolver |
| `CorruptionEntry` type | ❌ No existe | Crear en `core/loading/types/corruption.ts` |
| `DownloadChunk` type | ❌ No existe | Crear en `core/loading/types/download-chunk.ts` |

### Diagrama de fases target

```
login → auth → startLoading()
  │
  ├─ quota (2%)
  ├─ sw_precache (10%)
  ├─ db_open (15%)
  ├─ rehydrate_local (18%)
  │     └─ si core suficiente → [ready_partial] (salta a background tasks)
  ├─ warehouses (25%)
  ├─ products (40%)              ← DownloadQueueService (chunked, checksummed)
  │
  ├─ [fase paralela: core ya listo, comienza background] ──┐
  │     categories (43%)    ← fetchAll simple, non-blocking
  │     currencies (46%)    ← fetchAll, catálogo pequeño
  │     exchange_rates (48%)
  │     customer_debts (50%)
  │
  ├─ stock (52%)                ← ready_partial tras stock completado
  │     └─ [ready_partial] ← App usable
  │
  ├─ customers (58%)
  ├─ suppliers (62%)
  │     └─ [ready_complete si no hay map_tiles ni precache pendientes]
  │
  ├─ [background tasks, no bloquean availability]:
  │     ├─ image_prefetch ──→ background: thumbnails primeros 50 imágenes
  │     │                       [suspende si hidden, batería baja, no bloquea]
  │     ├─ map_tiles ───────→ solo verificación checksum (non-fatal)
  │     ├─ map_tiles ──→ solo verificación checksum (non-fatal)
  │     └─ precache_routes ──→ 6 shell routes, credentials: 'omit' (non-fatal)
  │     └─ [ready_complete] ← ambas background tasks completadas (counter 0→2)
```

---

## Fase A — Fundaciones offline: IDB v5 + store refactor + appLogger + fix endpoint ✅ Completado

> **Skills**: `senior-frontend`, `hexagonal-architecture`, `clean-code`
> **Objetivo**: Schema IDB v5 con índices realmente útiles, sistema de logs con buffer+flush (+ guard `idbReady`), fix endpoint roto, campo muerto eliminado, separación phase/availability en store, **migración de 14+ repos de HTTP-first a local-first**.
> **Por qué primero**: Todas las fases dependen del esquema IDB, del logger, y de que los repos lean localmente en vez de hacer HTTP.

### A.1 — Store refactor: separar `phase` de `availability`

**Archivo**: `frontend/src/core/loading/appLoaderStore.ts`

```typescript
export type LoadPhase =
  | 'idle' | 'quota' | 'sw_precache' | 'db_open'
  | 'rehydrate_local'   // 🆕
  | 'warehouses' | 'categories' | 'products'
  | 'customers' | 'suppliers' | 'stock'
  | 'map_tiles'
  | 'precache_routes';

export type AppAvailability =
  | 'blocking'
  | 'ready_partial'
  | 'ready_complete'
  | 'degraded'
  | 'error';

export interface AppLoaderState {
  phase: LoadPhase;
  availability: AppAvailability;  // 🆕 separado
  progress: number;
  step: string;
  subStep: string;
  subProgress: number;
  subTotal: number;
  // 🗑️ isComplete eliminado — redundante: availability === 'ready_complete' lo cubre
  // Background task counter: map_tiles (verify) + precache_routes = 2 tasks
  backgroundCompleted: number;   // cuántas background tasks han terminado
  backgroundTotal: number;       // total de background tasks (2: map_tiles + precache_routes)
  error: string | null;
  swCompleted: number;
  swTotal: number;
  showSwUpdateBanner: boolean;     // 🆕 — true cuando hay nuevo SW instalado con outbox pendiente
}
```

Agregar acciones `setAvailability()` y `setPhase()`. Eliminar `totalSteps` de `AppLoaderState` e `initialState`. Verificar con grep que ningún componente lo consuma.

> ⚠️ **Idempotencia de `startLoading()`: prevenir concurrencia desde múltiples renders.** Si React re-renderiza el componente que llama `startLoading()` antes de que termine el boot (ej: Strict Mode doble-mount en dev, navegación rápida, o doble efecto por dependencias), el loader puede iniciarse dos veces — duplicando descargas, corrompiendo el journal de chunks, y causando transiciones de fase inconsistentes.
>
> ```typescript
> // En AppLoaderStore (Zustand store) o como variable de módulo del hook:
> let bootInProgress = false;
>
> export const startLoading = createAsyncAction(async () => {
>   if (bootInProgress) return; // 🛡️ idempotente
>   bootInProgress = true;
>   try {
>     setAvailability('blocking');
>     setPhase('quota');
>     // ... flujo completo de boot ...
>   } finally {
>     bootInProgress = false;
>   }
> });
> ```
>
> **Verificación**: Inspeccionar que `startLoading()` se llame desde un solo lugar (ej: `useEffect` con dependencia inicial única, no desde render directo ni desde múltiples efectos). Aplicar guard en Zustand action o en la función que inicia el boot.

### A.2 — PHASE_WEIGHTS y PHASE_LABELS actualizados

```typescript
const PHASE_WEIGHTS: Record<LoadPhase, number> = {
  idle: 0, quota: 2, sw_precache: 10, db_open: 15,
  rehydrate_local: 18,
  warehouses: 25,
  products: 40,               // sube rápido: products habilita Dashboard
  categories: 43,              // catálogo pequeño, no bloquea ready_partial
  currencies: 46,              // catálogos secundarios (corren en background post-ready_partial)
  exchange_rates: 48,
  customer_debts: 50,
  stock: 52,                   ← ready_partial (core: warehouses+products+stock completos)
  customers: 58,
  suppliers: 62,
  map_tiles: 85,
  precache_routes: 90,
};

// ⚠️ image_prefetch NO tiene weight — no es fase del loader.
// Corre como background task después de ready_partial.
// ⚠️ categories, currencies, exchange_rates, customer_debts se cargan EN PARALELO
// después de products pero ANTES de ready_partial si hay ancho de banda.
// No bloquean la transición a ready_partial — si alguna falla, solo degradan.

// availability labels para UI
const AVAILABILITY_LABELS: Record<AppAvailability, string> = {
  blocking: 'Preparando aplicación',
  ready_partial: 'App lista',
  ready_complete: 'Todo listo',
  degraded: 'App lista (con algunas limitaciones)',
  error: 'Error al cargar',
};
```

### A.3.1 — Inventario completo de stores IDB v5

**DB_VERSION = 5**. Total stores: 24 (eran 17 en v4). Nuevos en v5: `corruptionQueue`, `downloadChunks`, `appLogs`, `imageIndex`, `geoIndex`, `mapMarkers`, `mapAnnotations` + índices compuestos añadidos a stores existentes.

| Store | keyPath | Índices | TTL/Purge | Notas |
|-------|---------|---------|-----------|-------|
| `products` | `id` | by-category-status (`[categoryId, status]`) | Persistente | v4 existente, índice nuevo en v5 |
| `categories` | `id` | — | Persistente | Sin cambios |
| `warehouses` | `id` | — | Persistente | Sin cambios |
| `customers` | `id` | by-name-lower (`nameLower`) | Persistente | Índice nuevo en v5 |
| `suppliers` | `id` | — | Persistente | Sin cambios |
| `stockBalances` | `id` | by-warehouse-product (`[warehouseId, productId]`, unique) | Persistente | Índice nuevo en v5 |
| `currencies` | `id` | — | Persistente | Sin cambios |
| `exchangeRates` | `id` | — | Persistente | Sin cambios |
| `customerDebts` | `id` | — | Persistente | Sin cambios |
| `sales` | `id` | by-status-date (`[status, saleDate]`), by-customer-status (`[customerId, status]`), by-sale-date (`saleDate`) | Rolling 90d | Índices nuevos en v5 |
| `purchases` | `id` | — | Rolling 180d | Sin cambios (solo prune) |
| `movements` | `id` | by-occurred-at (`occurredAt`) | Rolling 90d | Índice nuevo en v5 |
| `transfers` | `id` | — | Rolling 90d | Sin cambios |
| `adjustments` | `id` | — | Rolling 90d | Sin cambios |
| `returns` | `id` | — | Rolling 90d | Sin cambios |
| `notifications` | `id` | — | TTL 30d | Sin cambios |
| `outbox` | `id` | by-status (`syncStatus`), by-status-priority (`[syncStatus, priority]`) | Hasta sync exitoso | Índice nuevo en v5 |
| `deadLetter` | `id` | — | Hasta resolución manual | Sin cambios |
| `appLogs` | **Nuevo** `id` (autoIncrement) | by-level (`level`), by-timestamp (`timestamp`) | TTL 7d, max 5000 | Nuevo en v5 |
| `corruptionQueue` | **Nuevo** `id` (autoIncrement) | by-entity-type (`entityType`), by-status (`status`) | Hasta resolución o 30d | Nuevo en v5 |
| `downloadChunks` | **Nuevo** `chunkKey` | by-entity (`entityType`), by-status (`status`) | Purga committed > 24h | Nuevo en v5 |
| `imageIndex` | **Nuevo** `key` | by-entity (`[entityType, entityId]`), by-last-access (`lastAccessedAt`), by-size (`sizeBytes`) | LRU 100MB (prune automático) | Nuevo en v5, reemplaza imageCache |
| `geoIndex` | **Nuevo** `id` | by-type (`type`), by-name (`normalizedName`), by-parent (`parentIds`, multiEntry) | Persistente | Nuevo en v5 |
| `mapMarkers` | **Nuevo** `id` | by-user (`userId`), by-entity (`[entityType, entityId]`), by-coords (`[lat, lng]`) | Persistente | Nuevo en v5 |
| `mapAnnotations` | **Nuevo** `id` | by-user (`userId`) | Persistente | Nuevo en v5 |

**Nota**: `auth/session metadata` y `syncMeta` se almacenan en localStorage o stores existentes según implementación actual. `incidents/conflicts` se almacenan en stores existentes (SyncIncident) — sin cambios.

**Archivo**: `frontend/src/infrastructure/storage/db.ts`

Version bump: `DB_VERSION = 4` → `DB_VERSION = 5`.

Índices priorizados por consultas reales de UI (no "por si acaso"):

```typescript
if (oldVersion < 5) {
  // stockBalances: compuesto warehouse+product (único — consulta real: stock por ubicación)
  const stockStore = tx.objectStore('stockBalances');
  stockStore.createIndex('by-warehouse-product', ['warehouseId', 'productId'], { unique: true });

  // products: by-category-status (filtro real: productos por categoría y estado)
  const prodStore = tx.objectStore('products');
  prodStore.createIndex('by-category-status', ['categoryId', 'status'], { unique: false });

  // NO crear by-status-date en products — cachedAt no es eje de consulta UI real

  // sales: by-status-date + by-customer-status (consultas reales: ventas por estado+fecha, por cliente+estado)
  const salesStore = tx.objectStore('sales');
  salesStore.createIndex('by-status-date', ['status', 'saleDate'], { unique: false });
  salesStore.createIndex('by-customer-status', ['customerId', 'status'], { unique: false });

  // customers: by-name-lower (búsqueda case-insensitive — consulta real)
  // ⚠️ Normalización: el campo `nameLower` debe computarse al guardar (no lo envía el backend).
  // En CustomerRepository (NO existe localCustomerRepository):
  //   const normalized = { ...customer, nameLower: customer.name.toLowerCase() };
  //   await db.put('customers', normalized);
  //   (aplicar en create()/update() donde se escribe a IDB)
  const custStore = tx.objectStore('customers');
  custStore.createIndex('by-name-lower', 'nameLower', { unique: false });

  // Nuevo: corruptionQueue
  const cqStore = db.createObjectStore('corruptionQueue', { keyPath: 'id', autoIncrement: true });
  cqStore.createIndex('by-entity-type', 'entityType', { unique: false });
  cqStore.createIndex('by-status', 'status', { unique: false });

  // Nuevo: downloadChunks
  const dcStore = db.createObjectStore('downloadChunks', { keyPath: 'chunkKey' });
  dcStore.createIndex('by-entity', 'entityType', { unique: false });
  dcStore.createIndex('by-status', 'status', { unique: false });

  // Nuevo: appLogs
  const logStore = db.createObjectStore('appLogs', { keyPath: 'id', autoIncrement: true });
  logStore.createIndex('by-level', 'level', { unique: false });
  logStore.createIndex('by-timestamp', 'timestamp', { unique: false });

  // Reemplazar imageCache (IDB) por imageIndex (solo metadatos, blobs en OPFS)
  const imgStore = db.createObjectStore('imageIndex', { keyPath: 'key' });
  imgStore.createIndex('by-entity', ['entityType', 'entityId'], { unique: false });
  imgStore.createIndex('by-last-access', 'lastAccessedAt', { unique: false });
  imgStore.createIndex('by-size', 'sizeBytes', { unique: false }); // para LRU eviction

  // Migración imageCache → imageIndex (v4 → v5):
  // Estrategia: deprecación gradual — en v5 crear imageIndex, no migrar blobs existentes.
  // Las imágenes en imageCache quedan huérfanas y se limpian en pruning automático.
  // imageCache store se elimina en v5 del schema (ya no se crea).
  // Las imágenes se re-descargan on-demand vía useImageCache.
  // Costo aceptable: la mayoría de usuarios tienen <100 imágenes cacheadas.
  // Si se desea migración completa, agregar efecto onupgradeneeded:
  //   1. Iterar imageCache: entry.value (blob) → writeOPFSFile(key, blob)
  //   2. Crear entrada en imageIndex con metadatos (size, type, lastAccessedAt)
  //   3. Al terminar, eliminar imageCache store
  // Decisión: NO implementar en MVP. imageCache se limpia en pruning.

  // Nuevo: mapMarkers (anotaciones/marcadores de mapa)
  const markersStore = db.createObjectStore('mapMarkers', { keyPath: 'id' });
  markersStore.createIndex('by-user', 'userId', { unique: false });
  markersStore.createIndex('by-entity', ['entityType', 'entityId'], { unique: false });
  markersStore.createIndex('by-coords', ['lat', 'lng'], { unique: false });

  // Nuevo: mapAnnotations (anotaciones libres en mapa, ej: notas de ruta)
  const annotStore = db.createObjectStore('mapAnnotations', { keyPath: 'id' });
  annotStore.createIndex('by-user', 'userId', { unique: false });

  // sales: by-sale-date para pruning rolling O(log n)
  const salesStore2 = tx.objectStore('sales');
  if (!salesStore2.indexNames.contains('by-sale-date')) {
    salesStore2.createIndex('by-sale-date', 'saleDate', { unique: false });
  }

  // movements: by-occurred-at para pruning rolling
  const movStore = tx.objectStore('movements');
  if (!movStore.indexNames.contains('by-occurred-at')) {
    movStore.createIndex('by-occurred-at', 'occurredAt', { unique: false });
  }

  // Nuevo: geoIndex (gazetteer offline)
  const geoStore = db.createObjectStore('geoIndex', { keyPath: 'id' });
  geoStore.createIndex('by-type', 'type', { unique: false });
  geoStore.createIndex('by-name', 'normalizedName', { unique: false });
  geoStore.createIndex('by-parent', 'parentIds', { unique: false, multiEntry: true });

  // ⚠️ La carga del geoIndex NO debe hacerse dentro de db_open (upgradeneeded).
  // Dentro de la transacción de upgrade no se pueden hacer peticiones asíncronas
  // (la transacción se cierra). En su lugar, la población del geoIndex se mueve a
  // un efecto separado que se ejecuta DESPUÉS de que la DB esté abierta y la app
  // haya alcanzado ready_partial (ver rehydrate_local detail en C.2 y A.12.5).
  //
  // Backend ya tiene tabla geo_regions (V21) con 15 provincias + ~170 municipios
  // Endpoint real: GET /api/v1/geo/provinces?countryCode=CU devuelve provincias
  //                GET /api/v1/geo/municipalities/{provinceId} devuelve municipios por provincia
  // ⚠️ NO existe el endpoint /api/v1/geo-regions — el plan usa este path solo como
  //    referencia conceptual. La implementación concreta debe usar los endpoints reales:
  //    1. GET /api/v1/geo/provinces?countryCode=CU → 15 provincias
  //    2. Para cada provincia: GET /api/v1/geo/municipalities/{id} → municipios (~170 total)
  //    Esto significa que la carga del geoIndex iterará provincias + sus municipios,
  //    no un único fetch "?type=all". Es un cambio pequeño (~170 fetches vs 1, pero
  //    sigue siendo < 500KB total y no bloquea boot).
  // Alias de migración: crear transformer que adapte la respuesta de /api/v1/geo/* al schema geoIndex
  //
  // Fallback si endpoint no disponible: el geoIndex simplemente queda vacío.
  // No bloquea boot, no impide ready_partial.
  // La UI (useGeoSearch) retorna array vacío y muestra "Búsqueda offline no disponible".
  // Un efecto en rehydrate_local reintenta la carga en background si falló la primera vez
  // (máximo 3 reintentos en la misma sesión).
  // geoIndex vacío NO degrada availability — solo deshabilita búsqueda geográfica.
}
```

### A.4 — Schema `CorruptionEntry` (nuevo)

**Archivo**: `frontend/src/core/loading/types/corruption.ts`

```typescript
export type CorruptionStatus = 'pending' | 'repaired' | 'discarded';

export interface CorruptionEntry {
  id?: number;
  entityType: string;
  chunkKey: string;
  rawPayload: string;
  parseError: string;
  receivedAt: number;
  status: CorruptionStatus;
  repairedPayload?: string;
  repairedAt?: number;
}
```

### A.5 — Schema `DownloadChunk` (nuevo)

**Archivo**: `frontend/src/core/loading/types/download-chunk.ts`

```typescript
export type ChunkStatus = 'pending' | 'downloading' | 'validated' | 'committed' | 'failed' | 'corrupted';

export interface DownloadChunk {
  chunkKey: string;
  entityType: string;
  page: number;
  totalPages: number;
  itemCount: number;
  checksum: string;
  status: ChunkStatus;
  retryCount: number;
  userId: string;          // 🆕 filtrar por usuario activo — evitar cross-user interference
  committedAt?: number;
  failedReason?: string;
}
```

### A.6 — `appLogger.ts` con buffer + flush periódico (nuevo)

**Archivo**: `frontend/src/infrastructure/logging/appLogger.ts`

Logger estructurado con:
- Niveles: debug, info, warn, error
- Buffer en memoria (500 entradas) + flush periódico a IDB (cada 5s o al llegar a 50 entradas)
- Solo emite a console en development
- IDB store `appLogs` con TTL de 7 días (purga en cada flush)
- Límite máximo de 5000 entradas en IDB
- Truncar `context` si supera 10KB para evitar sobrecarga de serialización
- Export JSON de incidentes/logs para soporte
- No serializar objetos profundos completos por defecto (`context` se pasa como `unknown`, se serializa como JSON truncado)

> ⚠️ **Guard crítico contra flush prematuro a IDB**: El flusheo a IDB solo debe ocurrir cuando `db_open` ya completó exitosamente. Si `appLogger.error()` se invoca durante la fase `db_open` (ej: IDB no abre y queremos loguear el error), el logger no debe intentar `openDB()` a su vez — eso crearía un bucle de error silencioso. Implementar con flag `idbReady`:

```typescript
// Variable global de módulo que indica si IDB está disponible para escritura
let idbReady = false;

// Setter llamado por el loader después de db_open exitoso (en useAppLoader.ts):
//   import { setIdbReady } from '@/infrastructure/logging/appLogger';
//   await openDB('inventory-offline', 5);
//   setIdbReady(true);
export function setIdbReady(ready: boolean): void { idbReady = ready; }

// En flushToIDB():
async function flushToIDB(): Promise<void> {
  if (buffer.length === 0) return;
  if (!idbReady) return;  // 🛡️ IDB aún no disponible — buffer retiene los logs
  if (!isDev) return;
  // ... resto del flush normal ...
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  id?: number;
  level: LogLevel;
  message: string;
  context?: string;  // serializado y truncado
  timestamp: number;
  deviceId?: string;
}

const MAX_MEMORY = 500;
const MAX_IDB_ENTRIES = 5000;
const MAX_CONTEXT_SIZE = 10_240; // 10KB
const FLUSH_INTERVAL_MS = 5000;
const IDB_LOG_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const isDev = process.env.NODE_ENV === 'development';

const buffer: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function safeSerialize(ctx: unknown): string | undefined {
  if (ctx === undefined) return undefined;
  try {
    const str = JSON.stringify(ctx);
    return str.length > MAX_CONTEXT_SIZE ? str.slice(0, MAX_CONTEXT_SIZE) + '...' : str;
  } catch { return String(ctx).slice(0, MAX_CONTEXT_SIZE); }
}

async function flushToIDB(): Promise<void> {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);
  if (!isDev) return;
  try {
    const { openDB } = await import('idb');
    const db = await openDB('inventory-offline', 5);
    const tx = db.transaction('appLogs', 'readwrite');
    for (const entry of batch) await tx.store.add(entry);
    await tx.done;
    // Purge by TTL
    const cutoff = Date.now() - IDB_LOG_TTL_MS;
    const index = db.transaction('appLogs', 'readwrite').store.index('by-timestamp');
    let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoff));
    while (cursor) { cursor.delete(); cursor = await cursor.continue(); }

    // Strict max enforcement: si sigue > MAX_IDB_ENTRIES, eliminar más antiguas
    const remaining = await db.count('appLogs');
    if (remaining > MAX_IDB_ENTRIES) {
      const toDelete = remaining - MAX_IDB_ENTRIES;
      let deleted = 0;
      let oldestCursor = await index.openCursor();
      while (oldestCursor && deleted < toDelete) {
        oldestCursor.delete();
        deleted++;
        oldestCursor = await oldestCursor.continue();
      }
    }
  } catch { /* silent */ }
}

function scheduleFlush(): void {
  if (flushTimer) clearTimeout(flushTimer);
  if (buffer.length >= 50) { flushToIDB(); return; }
  flushTimer = setTimeout(() => flushToIDB(), FLUSH_INTERVAL_MS);
}

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('app-device-id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('app-device-id', id); }
  return id;
}

function log(level: LogLevel, message: string, context?: unknown) {
  const entry: LogEntry = {
    level,
    message,
    context: safeSerialize(context),
    timestamp: Date.now(),
    deviceId: getDeviceId(),
  };
  buffer.push(entry);
  if (buffer.length > MAX_MEMORY) buffer.shift();
  if (isDev) console[level](`[${level.toUpperCase()}] ${message}`, context ?? '');
  scheduleFlush();
}

export const appLogger = {
  debug: (msg: string, ctx?: unknown) => log('debug', msg, ctx),
  info: (msg: string, ctx?: unknown) => log('info', msg, ctx),
  warn: (msg: string, ctx?: unknown) => log('warn', msg, ctx),
  error: (msg: string, ctx?: unknown) => log('error', msg, ctx),
  getLogs: () => [...buffer],
  clearLogs: () => { buffer.length = 0; },
  flush: flushToIDB,
};
```

### A.7 — Fix endpoint en `useAppLoader.ts` + eliminar `totalSteps`

**Archivo**: `frontend/src/presentation/shared/hooks/storage/useAppLoader.ts`
- Línea 132: endpoint `/api/v1/products` → `/api/v1/products/paginated`, size `200` → `100`

### A.8 — AppLogViewer.tsx (nuevo, dev only)

**Archivo**: `frontend/src/presentation/shared/components/debug/AppLogViewer.tsx`

Floating panel (bottom-right, w-96, z-50) que muestra logs desde `appLogger.getLogs()` filtrados por nivel. Solo visible en `NODE_ENV=development` o con `?debug=1`. Se monta en layout root.

### A.9 — Reemplazar 12 console.error (DB + remaining)

| Archivo | Líneas | Cantidad |
|---------|--------|----------|
| `db.ts` | 491, 510, 521, 533 | 4 reemplazos |
| `useAuthStore.ts` | 58, 76, 82, 103, 134 | 5 reemplazos |
| `useSyncStatus.ts` | 89 | 1 reemplazo |
| `NotificationPanel.tsx` | 37 | 1 reemplazo |
| `PreferencesPanel.tsx` | 26 | 1 reemplazo |

### A.10 — SW communication channel: SET_USER_CONTEXT postMessage

**Archivo**: `frontend/src/presentation/shared/hooks/storage/useAuthStore.ts`
**Archivo**: `frontend/src/app/sw.ts` (o donde esté el Service Worker)

**Problema**: El plan exige "Namespace de cache SW por userId" pero el SW no tiene acceso directo a localStorage/IDB en el contexto del fetch handler. Sin conocer el `userId`, el SW no puede aislar caches por sesión ni limpiar caches correctamente al logout.

**Solución — canal de comunicación login/logout → SW**:

```typescript
// En useAuthStore.ts, después de login exitoso y antes de logout:
function notifySwUserContext(userId: string | null): void {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SET_USER_CONTEXT',
      payload: { userId },
    });
  }
}

// Llamar en:
// - onLoginSuccess(user) → notifySwUserContext(user.id)
// - onLogout() → notifySwUserContext(null)
// - onTokenRefresh() → notifySwUserContext(currentUserId) // reafirmar contexto
```

```typescript
// En sw.ts (o serwist route handler):
let currentUserId: string | null = null;

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SET_USER_CONTEXT') {
    currentUserId = event.data.payload.userId;
    // Abrir/crear cache nombrada: `inventory-offline-${userId}`
    // Nota: Serwist ya cachea assets estáticos globalmente (sin userId).
    // El namespace por userId aplica a rutas dinámicas que no deberían estar en SW cache.
    // Para assets estáticos (precache), el nombre de cache NO incluye userId.
  }
});

// En estrategias de fetch que usen rutas autenticadas:
// Si currentUserId es null → no cachear (sesión no establecida o cerrada)
// Si la ruta contiene datos de usuario → NetworkOnly, nunca cache
```

**Alcance**:
- El SW usa `currentUserId` solo para **limpiar caches al logout** y **aislar caches de rutas dinámicas** (no para el precache estático que es global).
- El precache de assets estáticos (JS/CSS/fonts/sprites/style) NO se namespaca — es global, compartido entre sesiones.
- El namespacing aplica a: páginas HTML cacheadas dinámicamente, respuestas API cacheadas en SW (que en nuestro caso no deben existir — la app lee de IDB).

**Verificación**: Al hacer logout → SW recibe `SET_USER_CONTEXT null` → SW borra caches con nombre `inventory-offline-{oldUserId}`.

### A.10.1 — SW update flow al hacer deploy

**Problema**: Cuando se despliega una nueva versión de la app, el Service Worker anterior sigue activo en clientes abiertos. Sin manejo explícito, el usuario ve la versión antigua hasta que cierra todas las pestañas (o pasa 24h — tiempo de refresco automático de SW).

**Configuración actual (serwist)**: `skipWaiting: true` + `clientsClaim: true` → el nuevo SW toma control inmediatamente al registrarse. Pero si hay un sync en curso, interrumpirlo puede perder operaciones de outbox a medio procesar.

**Flujo concreto para serwist config y app**:

1. **Configuración de serwist**: `skipWaiting: false` (mantener control en el nuevo SW hasta decisión), `clientsClaim: true`
2. **Listener en la app** (componente layout que registra serwist):

```typescript
// En el componente/layout que registra serwist:
const registration = await registerSerwist();

registration.addEventListener('updatefound', () => {
  const newSW = registration.installing;
  if (!newSW) return;

  newSW.addEventListener('statechange', () => {
    if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
      checkPendingSyncBeforeActivate();
    }
  });
});

async function checkPendingSyncBeforeActivate(): Promise<void> {
  const db = await openDB('inventory-offline', 5);
  const pendingCount = await db.countFromIndex('outbox', 'by-status', 'pending');

  if (pendingCount === 0) {
    // No hay operaciones pendientes — activar inmediatamente
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
    return;
  }

  // Hay operaciones pendientes — mostrar banner con botón
  // Banner: <Banner variant="info" icon={DownloadUpdateIcon}>
  //   "Nueva versión disponible — hay {pendingCount} cambios pendientes de sincronizar.
  //    Recarga después de que se complete la sincronización."
  //   <Button variant="outline" size="sm" onClick={forceActivate}>
  //     "Recargar ahora" (fuerza skipWaiting + recarga)
  //   </Button>
  // </Banner>
  // store.showSwUpdateBanner = true  (flag en Zustand: appLoaderStore)
}

function forceActivate(): void {
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
  window.location.reload();
}

// ====== EN EL SERVICE WORKER (sw.ts o serwist route) ======
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Al activar (activate event), limpiar caches viejas y notificar a los clientes:
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Limpiar caches de versión anterior
      caches.keys().then(keys => Promise.all(
        keys.filter(k => k.startsWith('inventory-offline-') && !k.includes(CACHE_VERSION))
          .map(k => caches.delete(k))
      )),
      // Notificar a los clientes que el SW está activo
      self.clients.matchAll().then(clients =>
        clients.forEach(client => client.postMessage({ type: 'SW_ACTIVATED' }))
      ),
    ])
  );
});
```

**Recomendación final para serwist config**:
- Usar `skipWaiting: false` + `clientsClaim: true`
- ⚠️ **Estado actual del código**: `frontend/src/app/sw.ts` tiene `skipWaiting: true`. **Cambiar a `false`** para alinearse con esta política.
- El nuevo SW espera hasta que la app decida activarlo (vía `SKIP_WAITING`)
- La app siempre verifica outbox pendiente antes de activar
- Si no hay outbox → activar y recargar automáticamente
- Si hay outbox → banner + botón "Recargar ahora" (acción del usuario)
- El SW nunca interrumpe un `POST` en curso — el navegador completa la request HTTP antes de activar el nuevo SW

### Files Summary A

| Archivo | Acción |
|---------|--------|
| `frontend/src/core/loading/appLoaderStore.ts` | Separar `phase`/`availability`; eliminar `totalSteps`; agregar `rehydrate_local`; +flag `isMapDownloading` para mutex de descarga |
| `frontend/src/infrastructure/storage/db.ts` | Upgrade v4→v5: índices selectivos + stores corruptionQueue, downloadChunks, appLogs, geoIndex, mapMarkers, mapAnnotations + 4 console.error → appLogger |
| `frontend/src/core/loading/types/corruption.ts` | Nuevo |
| `frontend/src/core/loading/types/download-chunk.ts` | Nuevo |
| `frontend/src/infrastructure/logging/appLogger.ts` | Nuevo — buffer + flush periódico + truncado context |
| `frontend/src/presentation/shared/components/debug/AppLogViewer.tsx` | Nuevo |
| `frontend/src/presentation/shared/hooks/storage/useAppLoader.ts` | Fix endpoint /api/v1/products → /api/v1/products/paginated, size 200→100 |
| `frontend/src/presentation/shared/hooks/storage/useAuthStore.ts` | 5 console.error → appLogger.error |
| `frontend/src/presentation/shared/hooks/storage/useSyncStatus.ts` | 1 console.error → appLogger.error |
| `frontend/src/presentation/shared/components/data-display/NotificationPanel.tsx` | 1 console.error → appLogger.error |
| `frontend/src/presentation/shared/components/feedback/PreferencesPanel.tsx` | 1 console.error → appLogger.error |

### A.11 — Migrar repositorios a patrón local-first (crítico)

> ⚠️ **Justificación**: El plan exige "Local-first UI, server-synchronized consistency", pero los 35 repos existentes usan `readWithCache(apiClient.get(...), idbFallback)` — HTTP como fuente primaria, IDB como fallback. Esto contradice el principio rector. Sin esta migración, toda la arquitectura offline-first existe solo en el loader, no en la app completa. La UI seguiría haciendo fetch HTTP como fuente primaria incluso después de que el loader cargue todo en IDB.

**Patrón target** — cada repositorio debe migrar de:

```typescript
// ❌ Antes (HTTP-first con IDB como fallback):
async getAll(): Promise<Product[]> {
  return readWithCache(
    () => apiClient.get('/api/v1/products/paginated'),
    () => db.getCachedProducts()
  );
}

// ✅ Después (local-first, lectura siempre desde IDB):
async getAll(): Promise<Product[]> {
  return db.getCachedProducts();
}
```

**Cambios requeridos por repositorio**:

| Repositorio | Patrón actual | Migración | Prioridad |
|-------------|---------------|-----------|-----------|
| `ProductRepository` | `readWithCache(apiClient.get, db.getCachedProducts)` | Eliminar `readWithCache`, leer directo de IDB | Alta |
| `CategoryRepository` | Ídem | Ídem | Alta |
| `WarehouseRepository` | Ídem | Ídem | Alta |
| `CustomerRepository` | Ídem | Ídem | Alta |
| `SupplierRepository` | Ídem | Ídem | Alta |
| `CurrencyRepository` | Ídem | Ídem | Media |
| `ExchangeRateRepository` | Ídem | Ídem | Media |
| `SaleRepository` | `readWithCache(apiClient.get, db.getCachedSales)` | Ídem | Media |
| `PurchaseRepository` | Ídem | Ídem | Media |
| `TransferRepository` | Ídem | Ídem | Media |
| `AdjustmentRepository` | Ídem | Ídem | Media |
| `ReturnRepository` | Ídem | Ídem | Media |
| `MovementRepository` | Ídem | Ídem | Media |
| `StockRepository` | `readWithCache(apiClient.get, db.getCachedStockBalances)` | Ídem | Alta |
| `CustomerDebtRepository` | HTTP directo (ni siquiera usa `readWithCache`) | Agregar `db.getCachedCustomerDebts()` como fuente local | Alta |
| `NotificationRepository` | HTTP directo | Depende del módulo (notificaciones on-demand OK) | Baja |
| `DashboardRepository` | HTTP directo | Compute desde IDB local | Media |
| `DashboardMetricsRepository` | HTTP directo | Compute desde IDB local | Media |
| Auth/User/Role repos | HTTP directo | No cachear — auth siempre requiere servidor | N/A |

**Archivo clave**: `frontend/src/infrastructure/repositories/product/ProductRepository.ts` (y análogos)

**Nota de implementación**:
- No eliminar `readWithCache` ni `networkAwareUtils.ts` inmediatamente — primero migrar todos los repos a local-first, luego al final de la fase limpiar el utility si queda huérfano.
- Los métodos `create`, `update`, `delete` no cambian — siguen usando outbox/sync service.
- El SyncService debe invalidar TanStack Query después de cada sync pull exitoso para que los queries se refresquen desde IDB.

**DashboardRepository — compute desde IDB local**:
El `DashboardRepository` actual usa HTTP directo (`apiClient.get('/api/v1/dashboard/stats')`). Migrar a cómputo local:
```typescript
// Ejemplo de getStats() local-first:
async getStats(): Promise<DashboardStats> {
  const db = await openDB('inventory-offline', 5);
  const [products, customers, lowStockItems] = await Promise.all([
    db.count('products'),
    db.count('customers'),
    computeLowStockFromLocal(db), // iterar stockBalances + thresholds de productos
  ]);
  return {
    totalProducts: products,
    totalCustomers: customers,
    lowStockItems,
    // ... otros campos según DashboardStats del frontend
  };
}
```
El endpoint `/api/v1/dashboard/stats` del backend se mantiene para sync (el SyncService puede guardar el snapshot en una store local `dashboardCache`), pero la UI primaria lee del cómputo local. Implementar en Fase A.

**Verificación post-migración**:
```bash
# Verificar que ningún repositorio use apiClient.get como queryFn primaria
rg "apiClient\.get" frontend/src/infrastructure/repositories/ --include '*.ts'
# Debe retornar solo auth/user/report/export/audit repos (que no cachean)
```

### Files Summary A (actualizado)

| Archivo | Acción |
|---------|--------|
| `frontend/src/core/loading/appLoaderStore.ts` | Separar `phase`/`availability`; eliminar `totalSteps`; agregar `rehydrate_local`; +flag `isMapDownloading` para mutex de descarga |
| `frontend/src/infrastructure/storage/db.ts` | Upgrade v4→v5: índices selectivos + stores corruptionQueue, downloadChunks, appLogs, geoIndex, mapMarkers, mapAnnotations + 4 console.error → appLogger |
| `frontend/src/core/loading/types/corruption.ts` | Nuevo |
| `frontend/src/core/loading/types/download-chunk.ts` | Nuevo |
| `frontend/src/infrastructure/logging/appLogger.ts` | Nuevo — buffer + flush periódico + truncado context + guard `idbReady` |
| `frontend/src/presentation/shared/components/debug/AppLogViewer.tsx` | Nuevo |
| `frontend/src/presentation/shared/hooks/storage/useAppLoader.ts` | Fix endpoint /api/v1/products → /api/v1/products/paginated, size 200→100; +setIdbReady(true) post-db_open |
| `frontend/src/presentation/shared/hooks/storage/useAuthStore.ts` | 5 console.error → appLogger.error |
| `frontend/src/presentation/shared/hooks/storage/useSyncStatus.ts` | 1 console.error → appLogger.error |
| `frontend/src/presentation/shared/components/data-display/NotificationPanel.tsx` | 1 console.error → appLogger.error |
| `frontend/src/presentation/shared/components/feedback/PreferencesPanel.tsx` | 1 console.error → appLogger.error |
| **`frontend/src/infrastructure/repositories/*/...Repository.ts` (14 repos)** | Migrar de `readWithCache(HTTP, IDB)` a `local-first` (lectura siempre desde IDB) |
| **`frontend/src/infrastructure/repositories/customer/CustomerDebtRepository.ts`** | Agregar `db.getCachedCustomerDebts()` como fuente local |

### A.12 — Auditar formato de fechas en todos los stores (pruning readiness)

**Problema**: El pruning por ISO8601 (sección Política de Mantenimiento) compara strings `YYYY-MM-DD`. Si algún repositorio guarda fechas como `Date` object o timestamp numérico, el pruning falla silenciosamente.

**Tarea concreta**: Antes de implementar MaintenanceService (fase C), auditar el formato real de `saleDate`, `occurredAt`, `createdAt` en todos los repositorios locales y stores IDB:

| Store | Campo(s) de fecha | Formato esperado | Repositorio fuente | Verificado? |
|-------|-------------------|-----------------|-------------------|-------------|
| `sales` | `saleDate` | string ISO8601 | `localSaleRepository` | ⬜ |
| `purchases` | `occurredAt` | string ISO8601 | `localPurchaseRepository` | ⬜ |
| `movements` | `occurredAt` | string ISO8601 | `localMovementRepository` | ⬜ |
| `transfers` | `occurredAt` | string ISO8601 | `localTransferRepository` | ⬜ |
| `adjustments` | `occurredAt` | string ISO8601 | `localAdjustmentRepository` | ⬜ |
| `returns` | `occurredAt` | string ISO8601 | `localReturnRepository` | ⬜ |
| `notifications` | `createdAt` | number timestamp | `localNotificationRepository` | ⬜ |
| `appLogs` | `timestamp` | number timestamp | n/a (interno) | ⬜ |

**Acción**:
1. Para cada repositorio, inspeccionar `local*Repository.put()` y verificar qué valor se guarda en el campo de fecha
2. Si es string ISO8601 → OK, pruning funcionará
3. Si es `Date` object → convertir a string ISO8601 al guardar (`date.toISOString().split('T')[0]`)
4. Si es `number` timestamp → el pruning debe usar `< cutoffTimestamp` numérico (ver implementación concreta en la sección de pruning)
5. Documentar en comentario inline de cada repositorio el formato usado

**Ubicación en el código**: `frontend/src/infrastructure/repositories/*/local*Repository.ts` en los métodos `put()` / `bulkPut()`.

> ⚠️ Esta auditoría es **prerrequisito** para implementar `runDatePruning()` en MaintenanceService (fase C). Sin esto, el pruning puede eliminar incorrectamente registros o no eliminar nada silenciosamente.

**Verificación:**
```bash
cd frontend && pnpm exec tsc --noEmit && pnpm lint
```

### A.12.5 — Carga de geoIndex post-ready_partial (separado de db_open)

**Problema**: El plan original cargaba geoIndex durante `db_open` con fetch directo. Esto es incorrecto porque:
1. La transacción `upgradeneeded` de IDB no soporta peticiones asíncronas
2. Mezclar lógica de población del índice con migración del schema es peligroso
3. Si la red falla durante boot temprano, la app arranca sin geoIndex sin posibilidad de reintento

**Corrección**: Mover la carga de geoIndex a un efecto que se ejecuta **después** de `ready_partial`:

```typescript
// En useAppLoader.ts — hook separado que corre cuando availability === 'ready_partial'
useEffect(() => {
  if (store.availability !== 'ready_partial') return;
  if (geoIndexLoadedRef.current) return;

  (async () => {
    const db = await openDB('inventory-offline', 5);
    const existing = await db.count('geoIndex');
    if (existing > 0) return; // ya cargado en sesión anterior

    try {
      // ⚠️ El backend NO tiene /api/v1/geo-regions. En su lugar tiene:
      //   GET /api/v1/geo/provinces?countryCode=CU → provincias
      //   GET /api/v1/geo/municipalities/{provinceId} → municipios por provincia
      // La implementación iterará provincias + municipios para poblar geoIndex.
      // El frontend ya tiene GeoRegionRepository con estos métodos (ver infra repo).
      const repo = new GeoRegionRepository();
      const provinces = await repo.getProvinces('CU');
      const geoEntries: GeoFeature[] = [];
      for (const province of provinces) {
        geoEntries.push(transformToGeoEntry(province, 'province'));
        const municipalities = await repo.getMunicipalities(province.id);
        for (const muni of municipalities) {
          geoEntries.push(transformToGeoEntry(muni, 'municipality', province.id));
        }
      }
      const tx = db.transaction('geoIndex', 'readwrite');
      for (const entry of geoEntries) {
        await tx.store.put(entry);
      }
      await tx.done;
      appLogger.info(`[AppLoader] geoIndex cargado: ${geoEntries.length} entradas (${provinces.length} provincias)`);
    } catch (err) {
      appLogger.warn('[AppLoader] geoIndex non-fatal — búsqueda offline no disponible', err);
      // Reintentar máximo 3 veces en la misma sesión
      if (!geoIndexRetryRef.current) geoIndexRetryRef.current = 0;
      geoIndexRetryRef.current++;
    }
  })();
}, [store.availability]);
```

**Reglas**:
- No bloquea boot — corre cuando la app ya es usable
- Si falla, reintenta máximo 3 veces en la misma sesión
- No degrada `availability` — la búsqueda geográfica se deshabilita
- Reintento en cada ciclo de network detection (`useSyncStatus`)
- Se cachea en `geoIndexLoadedRef` para no repetir

### A.12.6 — nameLower en CustomerRepository

**Problema**: El índice `by-name-lower` en IDB v5 requiere que `nameLower` se compute al guardar. Sin esto, el índice nunca se puebla y la búsqueda case-insensitive no funciona.

**Acción**: Modificar `CustomerRepository.create()` y `CustomerRepository.update()` (NO existe `put()` ni un `localCustomerRepository` separado) para añadir el campo al escribir en IDB:

```typescript
// En frontend/src/infrastructure/repositories/customer/CustomerRepository.ts:
// ⚠️ El repositorio usa create()/update(), NO put(). Sobreescribir el método
// que escribe en IDB (normalmente el que llama a db.put()).

// En el método que escribe en IDB (crear o actualizar):
//   const normalized = { ...customer, nameLower: customer.name.toLowerCase() };
//   await db.put('customers', normalized);

// Si el repositorio usa bulkCreate/bulkUpdate, aplicar la misma normalización:
//   const normalized = customers.map(c => ({ ...c, nameLower: c.name.toLowerCase() }));

// Si el repositorio usa un método syncFromServer() que hace fetchAll + bulk IDB,
// agregar nameLower en el transform antes de db.put().
```

**Archivo**: `frontend/src/infrastructure/repositories/customer/CustomerRepository.ts`

> ⚠️ No asumir que existe `localCustomerRepository.ts`. El repositorio se llama `CustomerRepository.ts` y NO tiene un método `put()` separado. Usa `create()` para inserts y `update()` para modificaciones. La normalización `nameLower` debe aplicarse donde el repositorio escribe a IDB (típicamente en un helper interno `saveToIDB()` o directamente en `create()`/`update()` si cada uno escribe). Inspeccionar el archivo real antes de implementar.

---

## Fase B — Integridad de descarga: DownloadQueueService + validación DTO + quarantine

> **Skills**: `senior-frontend`, `web-performance-optimization`, `hexagonal-architecture`
> **Objetivo**: Reemplazar `fetchPaginated` por cola controlada con chunk validation SHA-256, atomic IDB commits, validación semántica de DTOs (basada en DTOs reales del backend), y quarantine de datos corruptos.

### B.1 — `DownloadQueueService.ts`

**Archivo**: `frontend/src/infrastructure/storage/DownloadQueueService.ts`

```typescript
const MAX_CONCURRENT = 3;

interface ChunkValidationResult {
  valid: boolean;
  errors: string[];
  itemCount: number;
}

// Pipeline de validación por entidad — basado en DTOs reales del backend
// VERIFICAR campos contra ProductResponse.java, CustomerResponse.java, etc.
const VALIDATORS: Record<string, (item: unknown) => string[]> = {
  products: validateProductDTO,
  customers: validateCustomerDTO,
  suppliers: validateSupplierDTO,
};

// ⚠️ Regla de transacciones IDB:
// - Correcto: una transacción por chunk (hasta 100 items):
//   tx = db.transaction(['products', 'downloadChunks'], 'readwrite');
//   items.forEach(i => tx.store.put(i)); await tx.done;
// - Incorrecto: un await db.put(store, item) por cada item (abre N transacciones).
// - Incorrecto: una transacción para todos los chunks (demasiado larga, aborta).

async function downloadEntityPaginated<T>(params: {
  entityType: string;
  endpoint: string;
  idbStore: string;
  pageSize: number;
  onProgress: (page: number, total: number) => void;
  signal?: AbortSignal;
}): Promise<void> {
  // 0. ⚠️ Coordinación multi-tab via navigator.locks:
  //    Sin este lock, dos tabs simultáneas descargan el mismo chunk dos veces,
  //    duplicando registros y corrompiendo el journal de downloadChunks.
  //    IDB transactions son por tab — no hay isolation entre tabs.
  //    navigator.locks es global entre tabs del mismo origen.
  // ⚠️ Fallback: Safari iOS 15.4+ soporta navigator.locks.
  //    Si no está disponible (browsers muy antiguos), ejecutar sin lock.
  //    La race condition solo ocurre si 2+ tabs descargan el mismo chunk exacto.
  //    Aceptable como fallback — no bloquea funcionalidad.
  const hasLocks = 'locks' in navigator;
  const lockFn = hasLocks
    ? <T>(name: string, fn: () => Promise<T>) => navigator.locks.request(name, fn)
    : <T>(_name: string, fn: () => Promise<T>) => fn();
  await lockFn(`download-lock-${params.entityType}`, async () => {
    // 1. Fetch primera página para obtener totalPages
    // 2. Crear cola de chunks con MAX_CONCURRENT = 3
    // 3. Por cada chunk:
    //    a. Fetch page
    //    b. Computar checksum (comparar con backend si envía chunkChecksum)
    //    c. Validar JSON parse
    //    d. Validar cada item via DTO validator
    //    e. Atomic IDB transaction: batchPut items + save DownloadChunk record
    //    f. On failure: increment retry (1s → 5s → 15s), quarantine tras 3 intentos
    // 4. Emitir progreso vía callback
    // 5. Respetar AbortSignal para suspender si tab oculta
    // 6. El hook llamante debe conectar AbortController:
    //    const abortRef = useRef(new AbortController());
    //    useEffect(() => () => abortRef.current.abort(), []);
    //    downloadEntityPaginated({ ..., signal: abortRef.current.signal });
  });
}
```

### B.2 — Validadores DTO (basados en DTOs reales del backend)

**Archivo**: `frontend/src/core/loading/validators/index.ts`

**⚠️ Paso obligatorio antes de codificar**: Leer los siguientes DTOs del backend y listar los nombres de campos EXACTOS (no supuestos):

```bash
# Campos requeridos para validadores:
backend/src/main/java/com/inventory/application/dto/product/ProductResponse.java
backend/src/main/java/com/inventory/application/dto/customer/CustomerResponse.java
backend/src/main/java/com/inventory/application/dto/supplier/SupplierResponse.java
```

> Ejemplo de verificación: el DTO real `ProductResponse.java` puede tener `salePrice` y `standardCost`, NO `price`. El validador debe usar el nombre exacto del campo Java/JSON. Los nombres de campo en DTO se serializan a camelCase en JSON automáticamente con Jackson.

> ⚠️ Los nombres de campo deben coincidir con los DTOs reales del backend. NO inventar `price` — verificar si el DTO real usa `salePrice`, `standardCost`, `price`, etc. Revisar `ProductResponse.java` para nombres exactos.

```typescript
export function validateProductDTO(item: unknown): string[] {
  const errors: string[] = [];
  if (!item || typeof item !== 'object') return ['Item no es un objeto'];
  const p = item as Record<string, unknown>;
  if (!p.id) errors.push('id requerido');
  if (!p.name || typeof p.name !== 'string') errors.push('name requerido (string)');
  if (!p.sku || typeof p.sku !== 'string') errors.push('sku requerido (string)');
  // ⚠️ Verificar campo de precio real en ProductResponse.java — puede ser salePrice, standardCost, price, etc.
  if (p.salePrice !== undefined && (typeof p.salePrice !== 'number' || (p.salePrice as number) < 0))
    errors.push('salePrice debe ser número >= 0');
  if (p.stock !== undefined && (typeof p.stock !== 'number' || (p.stock as number) < 0))
    errors.push('stock debe ser número >= 0');
  return errors;
}

export function validateCustomerDTO(item: unknown): string[] {
  const errors: string[] = [];
  if (!item || typeof item !== 'object') return ['Item no es un objeto'];
  const c = item as Record<string, unknown>;
  if (!c.id) errors.push('id requerido');
  if (!c.name || typeof c.name !== 'string') errors.push('name requerido (string)');
  return errors;
}
```

### B.3 — Backend: opcional `chunkChecksum`

**Archivo**: `backend/.../product/ProductController.java` — record `PaginatedProductResponse`

```java
record PaginatedProductResponse(
    List<ProductResponse> content,
    long totalElements,
    int totalPages,
    int size,
    int number,
    @JsonInclude(JsonInclude.Include.NON_NULL) String chunkChecksum  // 🆕
) {
    public static PaginatedProductResponse of(Page<ProductResponse> page, ObjectMapper mapper) {
        try {
            String json = mapper.writeValueAsString(page.getContent());
            String checksum = "sha256:" + DigestUtils.sha256Hex(json);
            return new PaginatedProductResponse(
                page.getContent(), page.getTotalElements(),
                page.getTotalPages(), page.getSize(), page.getNumber(), checksum
            );
        } catch (JsonProcessingException e) {
            return new PaginatedProductResponse(
                page.getContent(), page.getTotalElements(),
                page.getTotalPages(), page.getSize(), page.getNumber(), null
            );
        }
    }
}
```

> ⚠️ No crear un DTO genérico `PaginatedResponse<T>` — el backend usa records locales por controller.

### B.4 — Actualizar `useAppLoader.ts` para usar DownloadQueueService

Reemplazar los efectos de `products`, `customers` y `suppliers` para que usen `downloadEntityPaginated` en vez de `fetchAll` simple:

| Entidad | Tamaño típico | Por qué DownloadQueueService |
|---------|--------------|------------------------------|
| `products` | 500–5000+ | Grande, chunked obligatorio |
| `customers` | 200–2000+ | Puede superar ~500, necesita checksum + retry |
| `suppliers` | 50–500 | Fronterizo — usar si hay presión de red; si no, fetchAll con JSON parse validation es aceptable |

**Regla**: Si `totalPages > 1` o `totalElements > 500`, usar `downloadEntityPaginated` automáticamente. Para conjuntos pequeños (categories < 50, currencies < 50), `fetchAll` directo con validación JSON es suficiente.

### B.4.5 — Validación de integridad para entidades de array plano

**Problema**: `chunkChecksum` (B.3) cubre solo `products` con paginación backend. `warehouses`, `categories`, `customers`, `suppliers`, `stockBalances` devuelven arrays planos sin paginación. Sin embargo, aún necesitan validación de integridad de transporte.

**Solución para fetchAll simple**:

```typescript
import { sha256 } from '@/core/utils/crypto'; // crypto.subtle.digest wrapper

async function fetchAllWithIntegrity<T>(
  endpoint: string,
  idbStore: string,
  options?: { signal?: AbortSignal }
): Promise<void> {
  const res = await apiClient.get(endpoint, { signal: options?.signal });
  const raw = res.data as T[];

  // 1. Validación JSON parse implícita (ya ocurre en apiClient.get)
  // 2. Checksum del array completo (opcional — solo si backend envía X-Content-Checksum)
  const serverChecksum = res.headers?.['x-content-checksum'];
  if (serverChecksum) {
    const clientChecksum = await sha256(JSON.stringify(raw));
    if (!clientChecksum.startsWith(serverChecksum)) {
      throw Object.assign(new Error(`Integrity check failed for ${endpoint}`), {
        errorCode: 'ERR_CHECKSUM_MISMATCH',
        entityType: idbStore,
      });
    }
  }

  // 3. Validación semántica básica (JSON parse + schema)
  const validator = VALIDATORS[idbStore];
  const errors: Array<{ index: number; fieldErrors: string[] }> = [];
  raw.forEach((item, i) => {
    const fieldErrors = validator?.(item) ?? [];
    if (fieldErrors.length > 0) errors.push({ index: i, fieldErrors });
  });
  if (errors.length > 0) {
    appLogger.warn(`[Integrity] ${errors.length} items con errores en ${idbStore}`, errors);
  }

  // 4. Atomic IDB commit
  const db = await openDB('inventory-offline', 5);
  const tx = db.transaction(idbStore, 'readwrite');
  for (const item of raw) await tx.store.put(item);
  await tx.done;
  appLogger.info(`[Integrity] ${raw.length} items guardados en ${idbStore}`);
}

// Backend: agregar header X-Content-Checksum en endpoints de array plano:
// @GetMapping("/api/v1/warehouses")
// public ResponseEntity<List<WarehouseResponse>> getAllWarehouses() {
//     List<WarehouseResponse> list = warehouseService.findAll();
//     String checksum = DigestUtils.sha256Hex(JSON.writeValueAsString(list));
//     return ResponseEntity.ok()
//         .header("X-Content-Checksum", "sha256:" + checksum)
//         .body(list);
// }
```

**Aplicar a**: `warehouses`, `categories`, `customers`, `suppliers`, `stockBalances` (cuando se descargan como fetchAll completo, no chunked).

**Backend**: Agregar `X-Content-Checksum` header a `GET /api/v1/warehouses`, `GET /api/v1/categories`, `GET /api/v1/customers`, `GET /api/v1/suppliers`, `GET /api/v1/stock-balances` usando `DigestUtils.sha256Hex` + `@JsonInclude`. Por consistencia con B.3, usar prefijo `sha256:`.

### B.5 — `CorruptionRepairCenter.tsx`

**Archivo**: `frontend/src/presentation/shared/components/data-repair/CorruptionRepairCenter.tsx`

Muestra chunks corruptos desde `corruptionQueue` con:
- Editor JSON para reparación manual
- Acción "Reparar y guardar" → reintenta commit
- Acción "Descartar" → marca como discarded
- Acción "Reintentar descarga" → re-descarga el chunk desde el backend
- Tooltips obligatorios en todas las acciones
- Mobile-first (min-h-11 en botones)

### Files Summary B

| Archivo | Acción |
|---------|--------|
| `frontend/src/infrastructure/storage/DownloadQueueService.ts` | Nuevo |
| `frontend/src/core/loading/validators/index.ts` | Nuevo — basado en DTOs reales del backend |
| `frontend/src/presentation/shared/hooks/storage/useAppLoader.ts` | Usar `downloadEntityPaginated` para products |
| `frontend/src/presentation/shared/components/data-repair/CorruptionRepairCenter.tsx` | Nuevo |
| Backend `ProductController.java` | Agregar `chunkChecksum` a `PaginatedProductResponse` |

**Verificación:**
```bash
cd frontend && pnpm exec tsc --noEmit && pnpm lint
cd backend/inventory-app && mvn compile -q
```

---

## Fase C — Loader robusto: phase/availability split + rehydrate_local + map_tiles + precache_routes

> **Skills**: `senior-frontend`, `web-performance-optimization`, `hexagonal-architecture`
> **Objetivo**: Implementar la máquina de estados separada (phase + availability), fase `rehydrate_local` para arranque instantáneo desde cache, y las fases non-fatal `map_tiles` + `precache_routes`.

### C.1 — `appLoaderStore.ts`: implementar separación

Usar la estructura definida en A.1. Acciones `setPhase()` y `setAvailability()` separadas.

**Transiciones clave:**

```typescript
// stock → ready_partial (o rehydrate_local → ready_partial si cache suficiente)
setPhase('stock');
// ... después de stock exitoso:
setAvailability('ready_partial');

// map_tiles + precache_routes corren en background después de ready_partial
// Al terminar precache_routes:
setAvailability('ready_complete');

// Si error fatal:
setAvailability('error');

// Si error non-fatal (mapa, precache):
setAvailability('degraded');
// La UI muestra "App lista (con algunas limitaciones)"
```

### C.2 — `rehydrate_local` effect

**Archivo**: `frontend/src/presentation/shared/hooks/storage/useAppLoader.ts`

> ⚠️ **Timeout de rehydrate_local**: Si IDB tarda > 8s en responder (disco lento, corrupción parcial, device gama baja), el boot no debe quedar bloqueado sin feedback. **Timeout máximo: 8s.** Si se supera:
> - **Core dataset ausente** → auditoría crítica. Forzar descarga completa (`setPhase('warehouses')`).
> - **Core dataset existe** → auditoría diagnóstica. Continuar con datos existentes (`setAvailability('ready_partial')`). Los chunks huérfanos se reintentan en background.
>
> Implementar con `Promise.race` entre `rehydrate_local` y un timer de 8s:
> ```typescript
> const rehydrate = (async () => {
>   const db = await openDB('inventory-offline', 5);
>   const [w, p, s] = await Promise.all([
>     db.count('warehouses'), db.count('products'), db.count('stockBalances'),
>   ]);
>   return { warehouseCount: w, productCount: p, stockCount: s };
> })();
>
> const timeout = new Promise<null>(resolve =>
>   setTimeout(() => resolve(null), 8000)
> );
>
> const result = await Promise.race([rehydrate, timeout]);
> if (!result) {
>   // Timeout — verificar con counts directos (segundo intento rápido)
>   appLogger.warn('[AppLoader] rehydrate_local timeout (>8s), forzando decisión');
> }
> ```

```typescript
useEffect(() => {
  if (store.phase !== 'rehydrate_local') return;
  (async () => {
    try {
      const db = await openDB('inventory-offline', 5);
      const [warehouseCount, productCount, stockCount] = await Promise.all([
        db.count('warehouses'),
        db.count('products'),
        db.count('stockBalances'),
      ]);
      // Core dataset: warehouses + products + stockBalances
      // ⚠️ categories NO bloquea ready_partial — sin categorías los productos
      //    siguen siendo funcionales (se muestran sin grupo).
      //    categories, currencies, exchangeRates, customerDebts se refrescan
      //    en background y no afectan disponibilidad.
      // ⚠️ stockBalances es suficiente para ready_partial — sin stock la app
      //    no puede mostrar Dashboard ni operaciones de inventario.
      // Umbral: > 0 para cada entidad — 1 warehouse + 1 producto + 1 stock
      // es suficiente para que la UI sea funcional.
      const hasMinCache = warehouseCount > 0 && productCount > 0 && stockCount > 0;

      if (hasMinCache) {
        setSubStep('Cargando datos locales...');
        setAvailability('ready_partial');
        // Background tasks inmediatas (no bloquean UI):
        prefetchImagesBackground(setSubStep, setSubProgress);  // image_prefetch
        // sync fresco se lanza desde el hook de sync, no desde el loader
      } else {
        setSubStep(`${productCount > 0 ? 'Actualizando' : 'Descargando'} productos...`);
        setPhase('warehouses');
      }
    } catch (err) {
      appLogger.error('[AppLoader] rehydrate_local falló, forzando descarga completa', err);
      setPhase('warehouses');
    }
  })();
}, [store.phase, setPhase, setAvailability, setSubStep]);
```

> ⚠️ `rehydrate_local` debe filtrar `downloadChunks` por `userId` activo para evitar cross-user interference. Si el usuario anterior dejó chunks huérfanos, no deben ser evaluados para resume del nuevo usuario.

### C.3 — `image_prefetch` background task (no bloqueante)

> ⚠️ **`image_prefetch` NO es fase del loader.** Corre como background task inmediatamente después de `ready_partial`, SIN weight en PHASE_WEIGHTS, SIN espera en el flujo de boot. Se dispara desde `useEffect` detectando `store.phase === 'idle'` después de alcanzar `ready_partial` (o como callback post-`setAvailability('ready_partial')`). No usa flag de `phase`. Si falla, solo log — no afecta `availability`. Si se completa antes que las otras fases, no acelera `ready_complete`.
> ⚠️ **NO debe modificar `setSubStep` / `setSubProgress` del loader principal.** Las background tasks tienen su propio store separado (`backgroundTasksStore`). Ver C.7.5 para detalle.

**Archivo**: `frontend/src/presentation/shared/hooks/storage/useAppLoader.ts`

```typescript
// Background task que corre cuando la app alcanza ready_partial.
// Disparador: callback desde startLoading() post-ready_partial.
// ⚠️ NO usa setSubStep/setSubProgress — usa backgroundTasksStore.
import { useBackgroundTasks } from '@/core/loading/backgroundTasksStore';

const IMAGE_PREFETCH_LIMIT = 50;  // Solo los primeros 50 productos para no saturar
const IMAGE_PREFETCH_CONCURRENCY = 2;

async function prefetchImagesBackground(): Promise<void> {
  const { startTask, updateTask, completeTask, failTask } = useBackgroundTasks.getState();
  const db = await openDB('inventory-offline', 5);
  const products = await db.getAll('products', undefined, IMAGE_PREFETCH_LIMIT);
  const toFetch = products.filter((p: any) => p.mainImage)
    .map((p: any) => ({ key: p.mainImage, path: toOPFSPath(p.mainImage, 'thumbnail') }));

  const total = toFetch.length;
  if (total === 0) return;
  startTask('image_prefetch', 'Precargando imágenes...', total);

  let done = 0;
  for (let i = 0; i < total; i += IMAGE_PREFETCH_CONCURRENCY) {
    if (document.hidden) break;
    // ⚠️ navigator.getBattery() está deprecated en Chrome, removido de Firefox.
    // Envolver en feature detection + try-catch para graceful fallback.
    const battery = 'getBattery' in navigator
      ? await (navigator as any).getBattery().catch(() => null)
      : null;
    if (battery && battery.level < 0.2 && !battery.charging) break;

    const batch = toFetch.slice(i, i + IMAGE_PREFETCH_CONCURRENCY);
    await Promise.allSettled(batch.map(async ({ key, path }) => {
      if (await opfsFileExists(path)) return;
      try {
        const res = await fetch(`/api/v1/images/${key}`);
        if (!res.ok) return;
        await writeOPFSFile(path, await res.arrayBuffer());
      } catch { /* non-fatal */ }
      finally {
        done++;
        updateTask('image_prefetch', done);
      }
    }));
  }
  if (done > 0) completeTask('image_prefetch');
}
```

> `image_prefetch` es **non-fatal**: si falla, la app continúa sin thumbnails cacheados y los carga on-demand en `useImageCache`. No transiciona fases ni pesa en `PHASE_WEIGHTS`.

### C.4 — `useAppLoader.ts`: effects para `currencies`, `exchange_rates`, `customer_debts`

Nuevos efectos para catálogos secundarios que corren en paralelo después de `products`:

```typescript
// Effect para currencies (catálogo pequeño, fetchAll sin chunk validation)
useEffect(() => {
  if (store.phase !== 'currencies') return;
  (async () => {
    try {
      setSubStep('Cargando monedas...');
      const data = await apiClient.get('/api/v1/currencies');
      const db = await openDB('inventory-offline', 5);
      const tx = db.transaction('currencies', 'readwrite');
      for (const item of data) await tx.store.put(item);
      await tx.done;
      appLogger.info(`[AppLoader] ${data.length} monedas cargadas`);
    } catch (err) {
      appLogger.warn('[AppLoader] currencies non-fatal — disponible solo online', err);
    }
  })();
}, [store.phase, setSubStep]);

// Effect para exchange_rates (catálogo pequeño, fetchAll)
useEffect(() => {
  if (store.phase !== 'exchange_rates') return;
  (async () => {
    try {
      setSubStep('Cargando tasas de cambio...');
      const data = await apiClient.get('/api/v1/exchange-rates');
      const db = await openDB('inventory-offline', 5);
      const tx = db.transaction('exchangeRates', 'readwrite');
      for (const item of data) await tx.store.put(item);
      await tx.done;
      appLogger.info(`[AppLoader] ${data.length} tasas cargadas`);
    } catch (err) {
      appLogger.warn('[AppLoader] exchange_rates non-fatal — tasas no disponibles offline', err);
    }
  })();
}, [store.phase, setSubStep]);

// Effect para customer_debts (snapshot, puede tener muchos registros)
useEffect(() => {
  if (store.phase !== 'customer_debts') return;
  (async () => {
    try {
      setSubStep('Cargando deudas de clientes...');
      const data = await apiClient.get('/api/v1/customer-debts');
      const db = await openDB('inventory-offline', 5);
      const tx = db.transaction('customerDebts', 'readwrite');
      for (const item of data) await tx.store.put(item);
      await tx.done;
      appLogger.info(`[AppLoader] ${data.length} deudas cargadas`);
    } catch (err) {
      appLogger.warn('[AppLoader] customer_debts non-fatal — deudas no disponibles offline', err);
    }
  })();
}, [store.phase, setSubStep]);
```

> Estos tres efectos son **non-fatal**: si fallan, la app continúa sin esos datos offline. `availability` se degrada a `degraded` solo si el error persiste. Las monedas, tasas y deudas no bloquean `ready_partial`.

### C.5 — `useAppLoader.ts`: effects para `map_tiles` + `precache_routes`

> ⚠️ **sw_precache**: antes de cualquier fase que dependa del SW, esperar `navigator.serviceWorker.ready` (no solo `.register()`) antes de enviar `START_PRECACHING`. Serwist tiene `clientsClaim: true` pero hay race condition entre registro y control.

**`map_tiles`** — solo verificación de integridad (la descarga es desde StoragePanel):

```typescript
// ⚠️ map_tiles ya NO transiciona a precache_routes via setPhase.
// Ambas son background tasks post-ready_partial que se ejecutan concurrentemente.
// El contador de background tasks vive en appLoaderStore:
//   backgroundCompleted: number (0-2, incrementa al finalizar cada una)
//   backgroundTotal: 2
//   Al llegar backgroundCompleted === backgroundTotal → setAvailability('ready_complete')

useEffect(() => {
  if (store.phase !== 'map_tiles') return;
  (async () => {
    try {
      const meta = await getMapMeta(); // desde syncMeta
      const root = await navigator.storage.getDirectory();
      if (meta?.installedAt) {
        const exists = await root.getFileHandle('cuba.pmtiles', { create: false }).then(() => true).catch(() => false);
        if (exists) {
          // Verificar checksum
          const file = await (await root.getFileHandle('cuba.pmtiles')).getFile();
          const buf = await file.arrayBuffer();
          const hashBuf = await crypto.subtle.digest('SHA-256', buf);
          const hex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
          if (`sha256:${hex}` !== meta.checksum) {
            appLogger.warn('[AppLoader] map checksum mismatch, marcando degraded');
            setAvailability('degraded');
          } else {
            setSubStep('Mapa verificado');
          }
        } else {
          appLogger.info('[AppLoader] mapa no descargado — disponible desde Settings');
        }
      } else {
        appLogger.info('[AppLoader] mapa no descargado — disponible desde Settings');
      }
    } catch { /* non-fatal */ }
    finally {
      setPhase('precache_routes');
      store.backgroundCompleted++;
      if (store.backgroundCompleted >= store.backgroundTotal) {
        setAvailability('ready_complete');
      }
    }
  })();
}, [store.phase, setPhase, setAvailability, setSubStep]);
```

**`precache_routes`** — cachear SOLO la ruta offline `/~offline`. **NO cachear rutas autenticadas** (`/dashboard`, `/products`, etc.) aunque se envíen con `credentials: 'omit'`, porque:
1. El servidor puede devolver 302 a login o 401, y eso se cachearía
2. La shell de la app requiere estar autenticada para mostrar el layout principal
3. La navegación se sirve desde IDB + TanStack Query, nunca desde SW cache

```typescript
useEffect(() => {
  if (store.phase !== 'precache_routes') return;
  (async () => {
    try {
      // Solo cachear la página offline — el resto de la navegación viene de IDB
      const OFFLINE_ROUTE = '/~offline';
      await fetch(OFFLINE_ROUTE);
      store.backgroundCompleted++;
      if (store.backgroundCompleted >= store.backgroundTotal) {
        setAvailability('ready_complete');
      }
    } catch (err) {
      appLogger.warn('[AppLoader] precache_routes non-fatal', err);
      store.backgroundCompleted++;
    }
  })();
}, [store.phase, setPhase, setAvailability]);
```

> ⚠️ Cambios importantes a `precache_routes`:
> 1. **Solo `/~offline`** — no cachear ninguna ruta autenticada aunque se envíe con `credentials: 'omit'`. La shell autenticada requiere sesión para mostrar layout correcto. Cualquier 302/401 que se cachee dejaría la app en estado inconsistente.
> 2. **NO transiciona a `ready_complete`** — `precache_routes` corre como background task post-ready_partial. `ready_complete` lo alcanza el store cuando todas las background tasks finalizan.
> 3. **La estrategia del SW** debe ser `NetworkOnly` para rutas autenticadas — nunca servirlas desde cache.
> 4. **NO usa `setSubStep`/`setSubProgress`** — reporta progreso via `backgroundTasksStore`.
> 5. **Estrategia de offline fallback para navegación**: Cuando el usuario recarga la página en una ruta autenticada (ej: `/dashboard`, `/products`) estando offline, el SW debe interceptar el `fetch` de tipo `navigate` y responder con `/~offline` si la red falla. Esto evita que el navegador muestre su página de error genérica ("No internet"). Implementar en el fetch handler del SW:
>    ```typescript
>    // En sw.ts (serwist worker), agregar al fetch listener:
>    self.addEventListener('fetch', (event: FetchEvent) => {
>      if (event.request.mode === 'navigate') {
>        event.respondWith(
>          fetch(event.request).catch(() => caches.match('/~offline'))
>        );
>      }
>    });
>    ```
>    Si Serwist ya maneja el fetch global, verificar que su `defaultCache` incluya la estrategia `offlineFallback` para rutas de navegación. Serwist soporta `fallbacks` en la configuración del runtime caching. Configurar:
>    ```typescript
>    // En serwist config:
>    fallbacks: {
>      entries: [
>        { url: '/~offline', revision: null },
>      ],
>    },
>    ```
>    Esto asegura que cualquier request `navigate` que falle en red se resuelva con `/~offline`, sin cachear HTML de rutas autenticadas.

### C.6 — `CacheProgressBar.tsx`: adaptar a phase/availability

**Archivo**: `frontend/src/presentation/shared/components/network-status/CacheProgressBar.tsx`

- PHASE_ORDER se actualiza con `rehydrate_local` y las nuevas fases (image_prefetch es background task, no tiene weight ni phase)
- `backgroundCompleted` / `backgroundTotal` cuentan las background tasks (map_tiles + precache_routes)
- La UI del progreso usa `phase` para la barra y `backgroundCompleted` para determinar ready_complete
- El mensaje principal usa `availability`:
  - `blocking` → muestra barra + fase actual (hasta stock)
  - `ready_partial` → banner colapsable "App lista — puedes descargar el mapa desde Configuración"
  - **Colapsable**: El banner en modo `ready_partial` debe ser colapsable (no ocupar espacio completo). Mostrar mini-barra de progreso discreta en el header (junto al icono de sync). `CacheProgressBar` se reduce a un badge en la barra de navegación con tooltip "Descargando recursos secundarios...". No mostrar banner full-width que ocupe espacio vertical.
  - `ready_complete` → "Todo listo" con check verde + tooltip con detalle de background tasks completadas
  - `degraded` → "App lista (con algunas limitaciones)" + detalle expandible de qué falló
  - `error` → mensaje de error + botón reintentar

### C.7 — HealthPanel.tsx (admin/dev only, ?debug=1)

**Archivo**: `frontend/src/presentation/shared/components/storage/HealthPanel.tsx`

Panel de diagnóstico accesible solo con `?debug=1` o desde settings avanzados. Muestra:

| Sección | Datos |
|---------|-------|
| **Cuota** | Usada / estimada, persistencia concedida |
| **IDB** | DB version, count por store, tamaño estimado |
| **Red** | NetworkMode actual (online/offline/unknown) |
| **Session** | SessionState, última sync exitosa, count outbox pendiente |
| **Auditoría** | Resultado de última auditoría de boot (crítica/diagnóstica) |
| **Mapa** | Instalado?, checksum, versión local vs servidor |
| **Background tasks** | backgroundCompleted / backgroundTotal |

**Acciones**: Botón "Ejecutar diagnóstico local" → corre auditoría completa y muestra resultado en `Dialog`. Botón "Forzar resync" → reinicia sync completo.

**Implementación**: Leer de Zustand store (`appLoaderStore`), IDB counts directos (`db.count('products')` etc.), sync meta. Solo lectura — no modifica estado.

#### C.7.5 — `backgroundTasksStore.ts`: store separado para progreso de background tasks

**Archivo**: `frontend/src/core/loading/backgroundTasksStore.ts`

Store Zustand independiente del loader principal para evitar contaminación de progreso:

```typescript
export interface BackgroundTaskProgress {
  id: string;                          // 'image_prefetch' | 'precache_routes' | 'map_verify' | 'catalog_refresh'
  label: string;                       // texto descriptivo (ej: 'Precargando imágenes...')
  completed: number;
  total: number;
  status: 'running' | 'done' | 'failed' | 'idle';
  error?: string;
}

export interface BackgroundTasksState {
  tasks: Record<string, BackgroundTaskProgress>;
  startTask: (id: string, label: string, total: number) => void;
  updateTask: (id: string, completed: number) => void;
  failTask: (id: string, error: string) => void;
  completeTask: (id: string) => void;
  resetTask: (id: string) => void;
}
```

**Reglas**:
- `image_prefetch` y `precache_routes` usan este store, NO `setSubStep`/`setSubProgress` del loader
- `map_tiles` (verify) también reporta aquí su progreso (checksum verification)
- `CacheProgressBar` **NO** muestra progreso de background tasks — solo un badge en icono sync
- `HealthPanel` (C.7) sí muestra el detalle completo de backgroundTasksStore
- `ready_complete` se computa desde `appLoaderStore.backgroundCompleted === backgroundTotal`, no desde aquí

### C.8 — Background refresh de catálogos post `ready_partial`

**Problema**: Después de alcanzar `ready_partial` (desde `rehydrate_local` con cache suficiente), los catálogos pueden estar stale. El diagrama menciona "refresh en background" pero no especifica quién lo dispara ni cómo se refleja en UI.

**Solución**:

1. **Disparador**: `useSyncStatus.ts` detecta `availability === 'ready_partial'` con flag `pendingBackgroundRefresh = true`. En ese estado, un efecto dispara `pullCatalogsIfStale()`.
2. **pullCatalogsIfStale()**: Función que itera entidades no-críticas y verifica `updatedAt` local vs servidor:
   ```typescript
   // En useSyncStatus.ts o SyncService.ts:
   async function pullCatalogsIfStale(): Promise<void> {
     const db = await openDB('inventory-offline', 5);
     const catalogs = ['categories', 'currencies', 'exchangeRates', 'customerDebts',
                       'customers', 'suppliers'];
     for (const entity of catalogs) {
       if (document.hidden) break;
       try {
         const syncMeta = await db.get('syncMeta', `last-sync-${entity}`);
         // Si no se ha sincronizado en > 1h, hacer pull
         if (!syncMeta || Date.now() - syncMeta.lastSyncAt > 3600000) {
           await pullEntity(entity); // fetchAll + overwrite IDB
           await db.put('syncMeta', { key: `last-sync-${entity}`, lastSyncAt: Date.now() });
         }
       } catch (err) {
         appLogger.warn(`[Sync] Background refresh de ${entity} falló`, err);
       }
     }
   }
   ```
3. **Progreso en UI**: No mostrar banner. Solo badge discreto en icono de sync (tooltip: "Actualizando catálogos..."). Si falla → `appLogger.warn` + badge "Algunos datos pueden no estar actualizados". No `Banner` — el usuario ya tiene datos usables.
4. **Si falla parcialmente**: No degrada `availability`. El catálogo fallido mantiene su versión local hasta el próximo intento (1h después o en próxima conexión detectada).
5. **No bloquear ready_complete**: `pullCatalogsIfStale()` no cuenta como background task. Corre independientemente de `map_tiles`/`precache_routes`. `ready_complete` se alcanza cuando las 2 background tasks del loader terminan, independientemente del estado de estos refrescos.

**Archivo**: `frontend/src/presentation/shared/hooks/storage/useSyncStatus.ts`

**⚠️ Riesgo de race condition**: Si el usuario hace pull manual desde Settings mientras `pullCatalogsIfStale()` está corriendo, ambas pueden sobrescribirse. Usar `navigator.locks.request('background-refresh')` para serializar.

### C.9 — StoragePanel.tsx (descarga de mapa, settings)

> ⚠️ **StoragePanel** depende de Fase E (MapLibre + PMTiles). Ver E.13 para implementación detallada.
> Se menciona aquí como dependencia de fase C, pero se implementa en E.

### 🧠 Nota: OPFS en Main Thread vs Worker

El MVP descarga/escribe PMTiles en **main thread** usando OPFS `createWritable()` + streaming. Esto es aceptable para el tamaño actual (~60-100MB). **Si el archivo PMTiles crece o se observan bloqueos perceptibles durante escritura/copia**, mover el pipeline de `map_tiles` a **Web Worker** usando `FileSystemFileHandle.createSyncAccessHandle()` (solo disponible en Worker). Dejar nota en el código y en ADR como mejora prioritaria post-MVP.

### 🧠 Nota: iOS Safari — OPFS limitado

**Contexto**: iOS Safari ≤ 16 no soporta `FileSystemFileHandle.createSyncAccessHandle()` en Workers (solo disponible en main thread). Safari 17+ lo soporta completamente (sync access handle en Workers). Adicionalmente, Safari tiene diferencias en OPFS:

| Aspecto | Safari ≤ 16 | Safari 17+ | Chrome/Firefox |
|---------|-------------|-------------|----------------|
| OPFS main thread `createWritable` | ✅ | ✅ | ✅ |
| OPFS Worker `createSyncAccessHandle` | ❌ | ✅ | ✅ |
| `navigator.locks` | ✅ (15.4+) | ✅ | ✅ |
| Cuota `estimate()` OPFS | ❌ No refleja OPFS | ❌ No refleja OPFS | ✅ Refleja correctamente |
| Storage pressure eviction | Alta (OPFS puede borrarse sin aviso) | Alta | Baja (con persist) |

**Implicaciones para el plan**:
- El MVP usa OPFS main thread para PMTiles (compatible con todos los navegadores modernos, incluyendo Safari 16+). Post-MVP, mover a Worker SOLO si se detecta que Safari 17+ está disponible.
- **Fallback Worker**: Si `navigator.storage.getDirectory()` falla en Worker context (Safari ≤ 16), detectar con `isOPFSAvailableInWorker()`:
  ```typescript
  async function isOPFSAvailableInWorker(): Promise<boolean> {
    try {
      // Solo disponible en Workers con Safari 17+
      const handle = await navigator.storage.getDirectory();
      await handle.getFileHandle('__probe__', { create: true });
      return true;
    } catch {
      return false;
    }
  }
  ```
- **Degradación**: Si OPFS no está disponible en Worker ni en main thread → `availability` se degrada a `degraded` con mensaje "Mapa offline no disponible en este dispositivo". La app funciona sin mapa.
- **Auditoría OPFS**: Durante `rehydrate_local`, ejecutar auditoría OPFS con `navigator.storage.getDirectory()`. Si falla → marcar como audit diagnóstica, continuar sin mapa offline. No bloquear boot.
- **No usar OPFS en `SharedWorker`** por falta de soporte consistente. Si se requiere Worker, usar `DedicatedWorker`.

### Files Summary C

**Verificación:**
```bash
cd frontend && pnpm exec tsc --noEmit && pnpm lint
```

---

## Fase D — Sync/conflictos: serverPayload + FieldDiffTable + políticas

> **Skills**: `senior-frontend`, `hexagonal-architecture`
> **Objetivo**: Agregar field-by-field diff table al `SyncConflictResolver` existente y formalizar políticas de conflicto por entidad.

### D.1 — Backend: agregar `serverPayload` a `PushResultDto`

**Archivo**: `backend/.../dto/sync/PushResultDto.java`

```java
package com.inventory.application.dto.sync;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

public record PushResultDto(
    String operationId,
    boolean accepted,
    Object data,
    String error,
    String entityId,
    @JsonInclude(Include.NON_NULL) Object serverPayload  // 🆕
) {}
```

**¿Qué contiene `serverPayload`?**
- Cuando `accepted = false` por conflicto de versión: `serverPayload` es el **snapshot completo** del registro actual en el servidor (todos los campos, incluyendo `version`). El frontend usa esto para renderizar `FieldDiffTable`.
- Cuando `accepted = false` por error de validación: `serverPayload` es `null` — no hay conflicto, solo error de negocio (mostrar `error` field).
- Cuando `accepted = true`: `serverPayload` puede ser `null` o el registro actualizado — el frontend lo ignora porque ya aplicó el cambio localmente.
- **Caso borde — objeto eliminado en servidor**: Si el cliente intenta actualizar un registro que fue borrado en el servidor, `serverPayload` es `null` y `errorCode` es `'NOT_FOUND'`. La UI debe mostrar: "El registro ya no existe en el servidor. ¿Conservar localmente o eliminar?" con acciones: "Conservar local" / "Eliminar local".

### D.2 — Frontend: FieldDiffTable en SyncConflictResolver

**Archivo**: `frontend/src/presentation/modules/sync/components/SyncConflictResolver.tsx`

Reemplazar `<pre>` blocks por tabla comparativa campo a campo.

**Campo `serverPayload` en el frontend**: `SyncConflictResolver` recibe el `PushResultDto` completo como prop. Extrae `serverPayload`, `clientPayload` y `entityType` para construir la tabla.

**Comportamiento cuando `serverPayload` es null**:
- `errorCode === 'NOT_FOUND'` → mostrar mensaje "El registro fue eliminado en el servidor" + acciones "Conservar local" / "Eliminar local"
- Otro `errorCode` → mostrar solo `errorMessage` sin tabla de diferencias (no hay datos del servidor para comparar)

```typescript
interface SyncConflictResolverProps {
  incident: SyncIncident;
  onResolve: (resolution: ConflictResolution) => Promise<void>;
}

type ConflictResolution = 
  | { action: 'use-server' }                     // overwrite local con serverPayload
  | { action: 'use-client' }                     // forzar push del clientPayload
  | { action: 'merge'; mergedPayload: unknown }  // merge manual
  | { action: 'delete-local' };                   // eliminar registro local (server lo borró)
```

### D.3 — Políticas documentadas en el componente

Añadir comentario en `SyncConflictResolver.tsx` referenciando la tabla de políticas de conflicto.

### D.4 — Verificar contrato de conflictos completo

Actualizar `PushResultDto.java` con todos los campos necesarios para field-by-field diff:

```java
public record PushResultDto(
    String operationId,
    boolean accepted,
    Object data,
    String error,
    String entityType,          // 🆕
    String entityId,             // 🆕
    String errorCode,           // 🆕 — ej: "OPTIMISTIC_LOCK", "VALIDATION_ERROR"
    String errorMessage,        // 🆕 — mensaje legible
    @JsonInclude(Include.NON_NULL) Object serverPayload,   // 🆕 — snapshot actual del servidor
    @JsonInclude(Include.NON_NULL) Object clientPayload,   // 🆕 — payload enviado por cliente (como myPayload en SyncIncident)
    @JsonInclude(Include.NON_NULL) Integer serverVersion,  // 🆕 — version actual del servidor
    @JsonInclude(Include.NON_NULL) Integer clientVersion   // 🆕 — version enviada por cliente
) {}
```

**Frontend `SyncConflictResolver.tsx`**: El componente `FieldDiffTable` recibe `serverPayload` + `clientPayload` y renderiza tabla campo a campo con diferencias resaltadas. Si `serverPayload` es null → no hay conflicto (error de validación simple, mostrar errorMessage).

**Comportamiento UI del FieldDiffTable**:
- Columnas: "Campo" | "Valor local (tuyo)" | "Valor servidor (otro)"
- Filas: solo campos donde `clientValue !== serverValue`
- Color: rojo para valor local distinto, verde para valor servidor distinto
- Acciones por fila: "Usar el mío" / "Usar el del servidor" / "Editar manualmente"
- Botón global: "Guardar cambios" que envía el merge resultante al backend
- Si no hay diferencias estructurales (solo version mismatch): mensaje "El registro fue actualizado pero no hay cambios visibles. ¿Sobrescribir?"

### D.5 — Implementar Tipo B (escrituras críticas)

**Definición**: Las escrituras Tipo B (confirmar venta, cerrar transferencia, ajuste final de inventario) requieren un protocolo más estricto que Tipo A.

**⛔ Guard offline para Tipo B**: Antes de intentar cualquier operación crítica, el componente UI debe verificar conectividad:

```typescript
async function handleCriticalAction(action: CriticalAction): Promise<void> {
  if (!navigator.onLine) {
    // Mostrar ConfirmDialog informativo (NO encolar automáticamente)
    const shouldQueue = await showConfirmDialog({
      title: 'Acción crítica sin conexión',
      message: 'Esta acción requiere confirmación del servidor para garantizar la integridad del inventario. '
             + 'Sin conexión, la operación quedará en estado pendiente hasta que el servidor la valide.',
      confirmLabel: 'Guardar en cola y continuar offline',
      cancelLabel: 'Cancelar',
      type: 'warning',
      // ⚠️ NO es ErrorState bloqueante — el usuario puede optar por encolar
    });
    if (!shouldQueue) return;
  }
  // continuar con outbox + estado PENDING...
}
```

La UI muestra este `ConfirmDialog` con tooltip adicional: "Las operaciones críticas requieren validación del servidor. Si encuestas sin conexión, el cambio no será efectivo hasta que el servidor lo confirme."

NUNCA encolar Tipo B sin consentimiento explícito del usuario. NUNCA mostrar `ErrorState` bloqueante de app — el usuario puede optar por cancelar y seguir usando la app offline para otras operaciones.

**Protocolo concreto por caso de uso:**

| Entidad | Operación | Estrategia offline | Estado local | Confirmación remota | Si reconecta y hay conflicto |
|---------|-----------|-------------------|-------------|---------------------|------------------------------|
| `sales` → CONFIRMED | POST `/api/v1/sales/{id}/confirm` | Guardar outbox con lotes de items y stock reservado. La venta NO se marca como CONFIRMED localmente — queda `PENDING_CONFIRMATION` | `PENDING_CONFIRMATION` (badge naranja) | Requiere POST exitoso al servidor. Si el servidor rechaza (stock insuficiente), incidente obligatorio. | Revisar stock disponible. Si otro usuario vendió el mismo producto, conflicto → incidente. |
| `transfers` → COMPLETED | POST `/api/v1/transfers/{id}/complete` | Guardar outbox. La transferencia queda `IN_TRANSIT` localmente, NO `COMPLETED` | `IN_TRANSIT` (badge naranja) | Requiere POST exitoso. El servidor verifica que origen tenga stock. | Si hubo cambios intermedios (ej: ajuste en origen), resolver con incidente. |
| `adjustments` → FINAL | POST `/api/v1/adjustments/{id}/finalize` | Guardar outbox. El ajuste queda `PENDING_FINALIZATION` localmente | `PENDING_FINALIZATION` (badge naranja) | Requiere POST exitoso. El servidor verifica consistencia del stock final. | Si el servidor ya tiene un ajuste con fecha posterior al offline, incidente. |

**Implementación detallada del outbox para Tipo B**:

> ⚠️ **Lock multi-pestaña para processOutbox**: Sin `navigator.locks`, dos pestañas pueden procesar el outbox simultáneamente, duplicando peticiones al servidor o corrompiendo `syncStatus`. El plan ya usa locks para descargas y refresh de token — extender el mismo patrón al outbox.

```typescript
// En SyncService.ts — procesamiento de outbox con prioridad + lock cross-tab:
async function processOutbox(): Promise<void> {
  // Adquirir lock cross-tab para evitar procesamiento paralelo
  // ⚠️ Fallback si 'locks' no está disponible: ejecutar sin lock
  const hasLocks = typeof navigator !== 'undefined' && 'locks' in navigator;
  const lockFn = hasLocks
    ? <T>(name: string, fn: () => Promise<T>) => navigator.locks.request(name, { ifAvailable: true }, fn)
    : <T>(_name: string, fn: () => Promise<T>) => fn({} as any);

  // Si otra tab ya está procesando, no esperar — salir y reintentar en el próximo ciclo
  const result = await lockFn('outbox-process-lock', async (lock) => {
    if (!lock) {
      appLogger.info('[Sync] outbox lock adquirido por otra tab — saltando');
      return { skipped: true };
    }

    const db = await openDB('inventory-offline', 5);
    // 1. Obtener pendientes ordenados: críticos primero, luego normales
    const critical = await db.getAllFromIndex('outbox', 'by-status-priority', 
      IDBKeyRange.only(['pending', 'critical']));
    const normal = await db.getAllFromIndex('outbox', 'by-status-priority',
      IDBKeyRange.only(['pending', 'normal']));
    const entries = [...critical, ...normal];

    for (const entry of entries) {
      if (!navigator.onLine) break; // suspender si offline

      try {
        entry.syncStatus = 'syncing';
        await db.put('outbox', entry);

        const result = await apiClient.post(entry.entityType === 'sales' 
          ? `/api/v1/sales/${entry.entityId}/confirm`
          : `/api/v1/transfers/${entry.entityId}/complete`, entry.payload);

        // Si accepted → marcar completed, actualizar estado local
        if (result.accepted) {
          entry.syncStatus = 'completed';
          await db.put('outbox', entry);
          await updateLocalEntityStatus(entry.entityType, entry.entityId, 'CONFIRMED');
        } else {
          // Conflicto o error → incidente
          await createIncident(result);
          entry.syncStatus = 'failed';
          await db.put('outbox', entry);
        }
      } catch (err) {
        entry.retryCount++;
        entry.lastError = String(err);
        entry.syncStatus = entry.retryCount >= 3 ? 'failed' : 'pending';
        await db.put('outbox', entry);
      }
    }
    return { skipped: false };
  });

  if (result?.skipped) return;
}
```

**Reglas**:
1. Las escrituras Tipo B se guardan localmente como `PENDING_CONFIRMATION` / `IN_TRANSIT` / `PENDING_FINALIZATION` (nunca como estado terminal)
2. El outbox marca la operación con `priority: 'critical'`
3. Al reconectar, se procesan ANTES que escrituras Tipo A (orden estricto: Tipo B → Tipo A)
4. Si el backend rechaza por estado inválido → incidente obligatorio (no overwrite automático)
5. La UI muestra estado "Pendiente de confirmación" con badge naranja hasta confirmación remota

**Casos borde**:
- **Cierre de venta offline**: no confirmar stock realmente hasta sync. El stock local puede quedar inconsistente si otra venta cierra primero en el servidor.
- **Transferencia concurrente**: si dos usuarios cierran la misma transferencia offline, el primer sync gana, el segundo → incidente.
- **Ajuste con fecha cruzada**: si el servidor ya tiene un ajuste posterior al offline → incidente.

### D.6 — Outbox schema con prioridad + índices IDB

**Archivo**: `frontend/src/infrastructure/sync/SyncService.ts`

Schema del outbox con soporte para prioridad Tipo B:

```typescript
interface OutboxEntry {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'create' | 'update' | 'delete' | 'critical';
  priority: 'normal' | 'critical';      // 🆕 — Tipo B = 'critical'
  payload: unknown;
  imageBlobs?: Array<{
    tempKey: string;
    opfsPath: string;
    originalFilename: string;
    contentType: string;
    size: number;
  }>;
  createdAt: number;
  syncStatus: 'pending' | 'syncing' | 'failed' | 'completed';
  retryCount: number;
  lastError?: string;
}
```

Nuevos índices en IDB v5:

```typescript
// En db.ts upgrade v5:
const outboxStore = db.createObjectStore('outbox', { keyPath: 'id' });
outboxStore.createIndex('by-status', 'syncStatus', { unique: false });
outboxStore.createIndex('by-status-priority', ['syncStatus', 'priority'], { unique: false });
```

> El índice `by-status-priority` permite ordenar outbox primero por status, luego por prioridad. SyncService usa `db.getAllFromIndex('outbox', 'by-status-priority', 'pending')` para obtener pendientes ordenados: críticos primero, luego normales.

### D.6.1 — Outbox lleno: comportamiento cuando se alcanza MAX_OUTBOX = 500

**Problema**: El plan define `MAX_OUTBOX = 500` en budgets pero no especifica qué ocurre cuando se alcanza. Sin manejo explícito, nuevas escrituras offline fallan silenciosamente.

**Comportamiento definido**:

| Acción | Comportamiento |
|--------|---------------|
| Crear nueva operación offline (Tipo A) | **Bloqueado** hasta que outbox baje de 400. Mostrar `InlineAlert`: "Cola de cambios local llena (500/500). Conéctate para liberar espacio antes de continuar editando." |
| Escrituras críticas (Tipo B) | Siempre requieren conexión — no se ven afectadas (no se pueden crear offline si el outbox está lleno porque el Tipo B ya exige conexión para confirmación remota) |
| Lectura local | Sin impacto — el usuario puede seguir consultando |
| Sync automático | Si hay conexión, el sync process drena el outbox automáticamente. Al bajar de 400, se reanudan escrituras Tipo A. |
| Offline sin conexión | El usuario debe esperar hasta reconectar. No hay pérdida de datos — el outbox mantiene las 500 operaciones. |

**Implementación**:

```typescript
// Error kind para outbox lleno
export type AppErrorKind =
  | 'network' | 'auth' | 'session-expired-sync' | 'conflict'
  | 'validation' | 'corruption' | 'quota' | 'map-download'
  | 'storage' | 'outbox-full'    // 🆕
  | 'unexpected';

// En SyncService.ts — antes de agregar al outbox:
async function addToOutbox(entry: Omit<OutboxEntry, 'id' | 'createdAt'>): Promise<void> {
  const db = await openDB('inventory-offline', 5);
  const pendingCount = await db.countFromIndex('outbox', 'by-status', 'pending');

  if (pendingCount >= MAX_OUTBOX) {
    throw Object.assign(new Error('Cola de cambios llena'), {
      errorCode: 'ERR_OUTBOX_FULL',
      kind: 'outbox-full' as AppErrorKind,
      pendingCount,
      max: MAX_OUTBOX,
    });
  }
  // ... guardar outbox normal ...
}
```

**UI**: El componente que maneja escrituras offline captura `AppErrorKind = 'outbox-full'` y muestra `InlineAlert`:
> "No se puede guardar porque la cola de cambios está llena (500/500). Conéctate al servidor para sincronizar los cambios pendientes."
> Botón: "Ir a sincronización" → abre panel de sync

**Canal UX**: `InlineAlert` persistente (no toast — requiere acción del usuario). Se cierra cuando outbox count baja de 400.

**Integración con la política existente**: El flag `outbox-full` se integra en la matriz de respuesta por error con severidad `non-fatal`, canal `InlineAlert`, y NO degrada `availability` (el resto de la app funciona).

### D.7 — Token rotation + TTL en backend

**Problema**: El refresh token actual dura 30 días sin rotación. Si es robado, es válido 30 días completos.

**Solución** (mínimo aceptable): Single-use rotation en endpoint de refresh — cada refresh invalida el token usado y emite uno nuevo.

**Requisito**: La tabla `refresh_tokens` ya existe con columna `revoked_at`. Solo falta implementar la lógica de revocación en el endpoint de refresh:

```java
// En AuthController /api/v1/auth/refresh
// 1. Validar refresh_token (firma + expiry)
// 2. Marcar como `revoked_at = now()` en la DB
// 3. Generar NUEVO refresh_token + access_token
// 4. Retornar ambos
```

**Impacto**: El frontend no necesita cambios — ya maneja renovación de tokens. Solo requiere que el backend emita un nuevo refresh_token en cada respuesta de refresh. El frontend debe actualizar el refresh_token almacenado tras cada refresh exitoso (verificar que `useAuthStore.ts` lo haga).

**⚠️ Acción concreta: Cambiar access token TTL de 30 días a 15–30 minutos.**

Archivo: `backend/inventory-app/src/main/resources/application.yml` (o `SecurityConfig.java`):

```yaml
# Antes (30 días):
app:
  jwt:
    access-token-expiration: 2592000000  # 30 días en ms
    refresh-token-expiration: 2592000000  # 30 días

# Después (15 min access, 30 días refresh):
app:
  jwt:
    access-token-expiration: 900000      # 15 minutos en ms
    refresh-token-expiration: 2592000000  # 30 días (sin cambios)
```

> La rotación de refresh token + TTL corto de access token forman el protocolo completo. Sin el cambio de TTL, el refresh silencioso no ocurre con la frecuencia necesaria y el access token expuesto tendría una ventana de 30 días.

**⚠️ Axios interceptor: race condition de refresh paralelo (misma tab y cross-tab)**: Si **múltiples requests simultáneos** reciben 401 (ej: dashboard carga 5 endpoints al mismo tiempo), el interceptor intenta `POST /api/v1/auth/refresh` varias veces en paralelo. Con refresh token rotation (single-use), el segundo refresh invalida el primero, dejando el usuario con token inválido y forzando login innecesario.

**⚠️ Race condition cross-tab**: `isRefreshing` es variable de módulo (por tab). Con 2+ tabs abiertas, ambas detectan 401 y ambas intentan refresh independientemente. Sigue el mismo problema: rotation invalida una de las dos.

**Solución — cola de espera de refresh + `navigator.locks` cross-tab**:

```typescript
// Variables globales del módulo del interceptor:
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
}

// ⚠️ Zustand no sincroniza estado entre pestañas. Para que waitForTokenRefresh
// funcione cross-tab, se necesita un canal de comunicación explícito.
// Solución combinada: BroadcastChannel (principal) + localStorage/storage event (fallback).
//
// 1. Después de un refresh exitoso, emitir token renovado por BroadcastChannel.
// 2. También guardar en localStorage (dispara storage event para pestañas antiguas).
// 3. waitForTokenRefresh escucha ambos canales.

const tokenChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('token-refresh')
  : null;

// Llamar después de refreshTokens() exitoso:
function broadcastTokenRefreshed(token: string): void {
  tokenChannel?.postMessage({ type: 'TOKEN_REFRESHED', token });
  localStorage.setItem('auth-refresh-token', token); // storage event para otras tabs
}

// Función auxiliar: espera hasta que otra tab renueve el token
async function waitForTokenRefresh(timeoutMs: number): Promise<void> {
  const start = Date.now();
  return new Promise<void>((resolve, reject) => {
    const check = () => {
      if (useAuthStore.getState().accessToken !== null) {
        resolve();
        return;
      }
      if (Date.now() - start >= timeoutMs) {
        reject(new Error('Token refresh timeout — otra tab no completó refresh a tiempo'));
        return;
      }
      setTimeout(check, 100);
    };

    // BroadcastChannel (moderno, principal)
    const bcHandler = (e: MessageEvent) => {
      if (e.data?.type === 'TOKEN_REFRESHED') {
        useAuthStore.getState().setAccessToken?.(e.data.token);
        resolve();
      }
    };
    tokenChannel?.addEventListener('message', bcHandler);

    // Storage event (fallback para Safari/tabs antiguas)
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'auth-refresh-token') resolve();
    };
    window.addEventListener('storage', storageHandler);

    check();

    // Cleanup
    Promise.resolve().finally(() => {
      tokenChannel?.removeEventListener('message', bcHandler);
      window.removeEventListener('storage', storageHandler);
    });
  });
}

// Asegurar que el store de Zustand persista el token a localStorage:
// En useAuthStore.ts, agregar persist middleware con partialize que incluya accessToken
// y refreshToken. Verificar que la rehidratación del store lea de localStorage en init.

// En el response interceptor (código completo):
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Solo interceptar 401, no reintentar si ya es refresh request
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Si ya hay un refresh en progreso en esta tab, poner esta request en cola
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(originalRequest);
      });
    }

    // No intentar refresh si offline
    if (getNetworkMode() === 'offline') {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // navigator.locks cross-tab: solo UNA tab puede refrescar a la vez.
      // Sin esto, 2+ tabs con 401 simultáneo harían refresh en paralelo
      // y rotation single-use invalidaría una.
      const { accessToken } = await navigator.locks.request(
        'token-refresh-lock',
        { ifAvailable: true },
        async (lock) => {
          if (!lock) {
            // Otra tab ya está refrescando → esperar a que termine
            await waitForTokenRefresh(5000);
            return { accessToken: useAuthStore.getState().accessToken };
          }
          return refreshTokens(); // POST /api/v1/auth/refresh
        }
      );
      processQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      setServerSessionExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
```

> **Comportamiento**: Si 5 requests obtienen 401 simultáneamente, solo 1 refresh se ejecuta. Las otras 4 quedan en cola y se re-ejecutan cuando el refresh termina, usando el nuevo access token. Sin esta cola, el segundo refresh invalida el primero (rotation) y el usuario termina con todos los tokens inválidos.
>
> **Comportamiento cross-tab**: `navigator.locks.request('token-refresh-lock', { ifAvailable: true }, ...)` asegura que solo UNA tab ejecute el refresh. Si otra tab también tiene 401, detecta que el lock no está disponible y espera via `waitForTokenRefresh()` hasta que la primera tab complete o hasta timeout de 5s. El token renovado se propaga via storage event + polling del store. Si timeout expira, la tab lanza error y el usuario ve el banner de sesión expirada en esa tab (puede recargar manualmente).
>
> **Fallback**: Si `navigator.locks` no está disponible (Safari < 15.4), el código ignora el lock y ejecuta el refresh directo (con riesgo de race condition cross-tab, pero aceptable como degradación).

Además, si el refresh falla estando online por 401 (refresh expirado), marcar `server-session-expired` sin reintentar automáticamente.

### Files Summary D

| Archivo | Acción |
|---------|--------|
| Backend `PushResultDto.java` | Agregar `serverPayload`, `entityType`, `entityId`, `errorCode`, `serverVersion`, `clientVersion` |
| `frontend/.../SyncConflictResolver.tsx` | Agregar `FieldDiffTable` con diff campo a campo + acciones por fila |
| `frontend/src/infrastructure/sync/SyncService.ts` | Outbox con prioridad Tipo B > Tipo A (+ índice by-status-priority); críticos generan incidente, no dead letter |
| Backend `AuthController.java` | Token rotation en refresh: marcar `revoked_at`, emitir nuevo refresh+access |
| Backend `application.yml` | Access token TTL: 30 días → 15 minutos (line 136 principios) |
| Backend `SecurityConfig.java` (opcional) | Si el TTL está hardcodeado en Java, cambiarlo aquí |
| Axios interceptor (en `useAuthStore.ts` o interceptor global) | Guard offline: verificar `getNetworkMode() !== 'offline'` antes de intentar refresh; + `navigator.locks.request('token-refresh-lock')` cross-tab; + `waitForTokenRefresh()` helper |
| Componentes que ejecutan Tipo B (SalesForm, TransferForm, AdjustmentForm) | +guard offline: `showConfirmDialog` antes de encolar si `!navigator.onLine`; no encolar sin consentimiento; badge de estado pendiente post-encolado |

**Verificación:**
```bash
cd frontend && pnpm exec tsc --noEmit && pnpm lint
cd backend/inventory-app && mvn compile -q
```

---

## Fase E — Mapa/GPS: MapLibre + PMTiles + streaming OPFS + geolocation + geo-index acotado

> **Skills**: `senior-frontend`, `web-performance-optimization`, `hexagonal-architecture`
> **Objetivo**: Migrar el stack de mapas de Leaflet a **MapLibre GL JS + PMTiles**. Streaming directo del archivo de mapa a OPFS. Índice offline de búsqueda geográfica **acotado** (país/provincia/municipio/ciudad, SIN calles completas en MVP). Integración GPS. **Descarga de tiles desde Settings** (no durante boot). **Compartir ubicación** con link universal compatible con Google Maps/OSM/Waze. **Persistencia de marcadores/anotaciones en backend**. Criterio de retiro de Leaflet definido.
>
> ⚠️ **Bundle size**: MapLibre GL JS ~500KB gzipped (~1.5MB sin comprimir) — es la librería más pesada del frontend. Se maneja exclusivamente con `next/dynamic` y `{ ssr: false }` para que no impacte el bundle inicial del servidor. El chunk de mapa se carga solo cuando el usuario navega a una vista que contiene un componente de mapa. No hay alternativa más ligera para mapas vectoriales offline con soporte de PMTiles nativo. Leaflet + plugins similares tendrían tamaño comparable o mayor si se suma `leaflet.vectorgrid` + `pmtiles`. Este tamaño está aceptado en el budget del proyecto.

> ⚠️ **Cambio arquitectónico clave**: `map_tiles` phase durante el boot solo **verifica** si el mapa ya está descargado en OPFS. La **descarga** del PMTiles se hace desde el **StoragePanel** en Settings, bajo demanda del usuario. Esto evita consumir ancho de banda/tiempo de boot y da control al usuario sobre cuándo descargar ~80-150MB.

### E.1 — Fuente de tiles de Cuba + servidor

**⚠️ Requisito previo: el archivo PMTiles debe pre-existir en el servidor antes del deploy. No se descarga en runtime.** El admin obtiene el archivo UNA VEZ desde Protomaps/OpenFreeMap (máquina con internet) y lo coloca en el classpath de Spring Boot. La app nunca hace fetch de un CDN externo.

**Fuentes disponibles:**

| Fuente | URL | Tamaño | Licencia |
|--------|-----|--------|----------|
| **Protomaps Basemaps** | `https://protomaps.com/downloads` — extract Cuba | ~80-150MB | BSD-style |
| **OpenFreeMap** | `https://openfreemap.org` — PMTiles por país | ~60-120MB | ODbL |

**Ubicación final en el proyecto:**
```
# ⚠️ NO en resources/static/ (no soporta Range requests fuera de JAR)
# El directorio externo se configura via application.yml:
backend/inventory-app/maps/cuba.pmtiles   # desarrollo
/var/data/maps/cuba.pmtiles                # producción
```

**Configuración en `application.yml`:**
```yaml
app:
  maps:
    location: ./maps/  # o file:/var/data/maps/ en producción
```

> El admin coloca `cuba.pmtiles`, `cuba.pmtiles.sha256` y `cuba.pmtiles.meta.json` en el directorio configurado antes del deploy. No se incluyen en el repo de Git por su tamaño. Los assets pequeños (fonts, sprites, style) sí van en `frontend/public/maps/`.

> Spring Boot sirve automáticamente archivos en `resources/static/` vía `ResourceHttpRequestHandler`. El PMTiles se sirve en `GET /api/v1/maps/cuba.pmtiles` con soporte Range requests. **No se incluye en el repo de Git por su tamaño** — se coloca manualmente antes del deploy o se copia via CI/CD desde un bucket externo.
>
> ⚠️ **El PMTiles NO debe estar en `frontend/public/maps/`**. El archivo es demasiado grande (60-150MB) para el bundle frontend y para ser servido por Next.js. Se sirve exclusivamente desde Spring Boot (`/api/v1/maps/cuba.pmtiles`). Los únicos assets de mapa en `frontend/public/maps/` son los pequeños (fonts ~100KB, sprites ~50KB, style.json ~5KB).
>
> **⚠️ Compatibilidad con Leaflet fallback (transición)**: El componente `MapContainer.tsx` existente referencia `/tiles/cuba.pmtiles` como `tilesUrl` por defecto — esta URL es un route de Next.js que NO existe. Durante la transición Leaflet→MapLibre, el tile URL de Leaflet debe cambiarse a `/api/v1/maps/cuba.pmtiles` (backend) o configurarse con `tilesConfigDefault.tilesUrl` desde el módulo que lo usa. En MapLibre (destino final), el PMTiles se carga via protocolo `pmtiles://` o `opfs-pmtiles://`, no via URL directa. La referencia `/tiles/` se elimina al retirar Leaflet.

> ⚠️ **El PMTiles NO debe servirse desde `resources/static/` (ClassPathResource)**. Cuando la app se ejecuta desde un JAR, `ClassPathResource` no permite acceso aleatorio (seek), por lo que MapLibre no puede hacer requests parciales (Range) y descargaría el archivo completo (~80-150MB) por cada tile renderizado. Se sirve desde un directorio externo configurable usando `FileSystemResource`, que sí soporta seek.

**Endpoint explícito requerido en Spring Boot** (para garantizar Accept-Ranges):

```java
@RestController
@RequestMapping("/api/v1/maps")
public class MapController {

    private final Environment env;

    public MapController(Environment env) {
        this.env = env;
    }

    @GetMapping("/{filename:.+}")
    public Mono<ResponseEntity<Resource>> serveMap(
            @PathVariable String filename,
            ServerHttpRequest request) {
        
        // ⚠️ EL ARCHIVO NO DEBE servirse desde resources/static/maps/ dentro del JAR
        // porque ClassPathResource no soporta acceso aleatorio (seek), necesario para
        // Range requests de PMTiles. MapLibre hace requests parciales vía HTTP Range:
        // sin seek, el servidor debe cargar el archivo COMPLETO en cada tile request.
        //
        // SOLUCIÓN: Servir desde directorio externo configurable via application.yml:
        //   app:
        //     maps:
        //       location: file:/var/data/maps/  # o ./maps/ para desarrollo
        //
        // El admin coloca cuba.pmtiles en ese directorio UNA VEZ antes del deploy.
        // FileSystemResource soporta seek y Range requests automáticamente con WebFlux.
        String mapsDir = env.getProperty("app.maps.location", "./maps/");
        Resource resource = new FileSystemResource(mapsDir + filename);

        // ⚠️ Headers obligatorios para PMTiles streaming:
        // - Accept-Ranges: bytes → MapLibre/PMTiles protocol usa Range requests
        //   para pedir solo el header del archivo (primeros ~4KB) y luego
        //   tiles individuales. Sin este header, MapLibre descarga el archivo
        //   COMPLETO (~100MB) en cada tile request.
        // - Cache-Control: immutable → el archivo no cambia entre deploys
        return Mono.just(ResponseEntity.ok()
            .header(HttpHeaders.ACCEPT_RANGES, "bytes")
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000, immutable")
            .body(resource));
    }

    @GetMapping("/{filename:.+}.meta.json")
    public Mono<ResponseEntity<Resource>> serveMapMeta(@PathVariable String filename) {
        String mapsDir = env.getProperty("app.maps.location", "./maps/");
        Resource resource = new FileSystemResource(mapsDir + filename + ".meta.json");
        if (!resource.exists()) return Mono.just(ResponseEntity.notFound().build());
        return Mono.just(ResponseEntity.ok()
            .header(HttpHeaders.CACHE_CONTROL, "no-cache")
            .body(resource));
    }
}
```

> `ResourceHttpRequestHandler` de Spring WebFlux maneja Range requests automáticamente cuando el `body` es un `Resource`, devolviendo `ResourceRegion` en la respuesta 206. El header `Accept-Ranges: bytes` se agrega explícitamente para que MapLibre/PMTiles protocol sepa que el servidor soporta requests parciales. Sin `Accept-Ranges`, MapLibre descarga el PMTiles completo en cada tile request.
>
> ⚠️ **Confirmación**: Spring Boot WebFlux + `Resource` devuelve automáticamente `206 Partial Content` con `Content-Range` cuando recibe un `Range` header. No se necesita un controller manual `MapController.java` si se usa `ResourceHttpRequestHandler` + `addResourceHandlers` — el handler built-in maneja Range requests vía `ResourceRegion`. Sin embargo, se recomienda mantener el controller explícito para: (1) servir fuera de `resources/static/` si el mapa está en disco separado, (2) personalizar headers por ruta, (3) compatibilidad con el sistema de versionado `.meta.json`.
>
> **IMPORTANTE**: `Accept-Ranges: bytes` es obligatorio incluso con el handler built-in. MapLibre y PMTiles protocol lo verifican para decidir si usar Range requests o descarga completa. Sin este header, MapLibre descarga el archivo completo (~100MB) en memoria por cada tile renderizado.

**Razón**: El backend ya está en la misma LAN, evita poner un binario grande (~80-150MB) en el repositorio frontend y centraliza el control del asset.

**Proceso de obtención del PMTiles** (ejecutado UNA VEZ por el admin en máquina con internet):

| Paso | Comando / URL | Notas |
|------|---------------|-------|
| **Opción A: Protomaps** | `wget https://maps.protomaps.com/builds/cuba.pmtiles?key=<free_api_key>` | ~80-150MB, licencia BSD-style |
| **Opción B: OpenFreeMap** | `wget https://openfreemap.org/data/cuba.pmtiles` | ~60-120MB, ODbL |
| **Opción C: Geofabrik + conversión** | `tippecanoe -zg -o cuba.pmtiles cuba.osm.pbf && pmtiles convert cuba.osm.pbf cuba.pmtiles` | Requiere OSM extract de Geofabrik (~60MB PBF) |
| **Generar metadata** | `sha256sum cuba.pmtiles > cuba.pmtiles.sha256 && echo '{"version":"2026-06","sha256":"sha256:'$(sha256sum cuba.pmtiles \| cut -d' ' -f1)'","sizeBytes":'$(stat -c%s cuba.pmtiles)',"updatedAt":"'$(date -Iseconds)'"}' > cuba.pmtiles.meta.json` | Genera los 3 archivos necesarios |
| **Colocar en servidor** | `cp cuba.pmtiles* /var/data/maps/` (o el directorio configurado en `app.maps.location`) | Spring Boot los sirve desde `FileSystemResource`, soportando Range requests |
| **Verificar en deploy** | `curl -I http://localhost:8080/api/v1/maps/cuba.pmtiles` | Debe responder con `Accept-Ranges: bytes` y `Cache-Control: immutable` |

> ⚠️ El servidor de desarrollo NO tiene internet en runtime. La descarga del PMTiles se hace **una vez por el admin** antes del deploy o desde una máquina con internet, luego se copia al servidor. No es una descarga que ocurra en producción.

**Endpoint**: `GET /api/v1/maps/cuba.pmtiles` con headers `Accept-Ranges: bytes`, `Cache-Control: public, max-age=31536000, immutable`. El frontend usa `fetch('/api/v1/maps/cuba.pmtiles')` para:
- Descarga a OPFS (StoragePanel) vía streaming
- Protocolo `pmtiles://` de MapLibre para renderizar desde la red (fallback si OPFS no disponible)

### E.2 — Assets offline requeridos

**Assets servidos por Spring Boot** (en `backend/inventory-app/src/main/resources/static/maps/`):
| Asset | Propósito | Fuente |
|-------|-----------|--------|
| `cuba.pmtiles` | Tiles vectoriales Cuba (~80-150MB) | Protomaps/OpenFreeMap |
| `cuba.pmtiles.sha256` | Hash SHA-256 del PMTiles | `sha256sum cuba.pmtiles > cuba.pmtiles.sha256` |
| `cuba.pmtiles.meta.json` | Metadata versionada | Mantenido manualmente |

**Assets servidos por Next.js** (en `frontend/public/maps/`):
| Asset | Propósito | Obtención | Precache Serwist |
|-------|-----------|-----------|------------------|
| `fonts/NotoSansRegular/0-255.pbf` | Fuente etiquetas | Protomaps Font Generator → `https://github.com/protomaps/fonts/releases` descargar NotoSans, extraer solo range 0-255 | ✅ |
| `fonts/NotoSansBold/0-255.pbf` | Fuente bold etiquetas | Ídem, usar variante Bold | ✅ |
| `sprites/sprite.json` + `sprite.png` | Sprites iconos | Protomaps Sprites → usar `spritesheet` de protomaps-basemaps o generar con `spritezero` | ✅ |
| `style.json` | Estilo MapLibre base | Definir una vez, versionar con el código | ✅ |

> ⚠️ **Estos assets se generan/descorgan UNA VEZ por el admin o se generan desde el código.** La app nunca debe fetch de internet. Los fonts y sprites se colocan manualmente en `frontend/public/maps/` y se versionan con el repositorio.

> ⚠️ El PMTiles NO se precachea en Serwist (es demasiado grande para SW cache). Solo se precachean los assets pequeños (fonts, sprites, style). El PMTiles se descarga a OPFS desde el endpoint del backend.

### E.3 — `MapLibreInitializer.ts`: registro de protocolos

**Archivo**: `frontend/src/infrastructure/maps/MapLibreInitializer.ts`

Se ejecuta **una sola vez, lazy**, antes de montar el primer mapa. Registra dos protocolos:

```typescript
import maplibregl from 'maplibre-gl';
import { Protocol } from 'pmtiles';

let initialized = false;

export function initializeMapLibre(): void {
  if (initialized) return;
  // Protocolo pmtiles:// → HTTP range requests al servidor (cuando mapa se sirve desde backend)
  const serverProtocol = new Protocol();
  maplibregl.addProtocol('pmtiles', serverProtocol.tile.bind(serverProtocol));
  initialized = true;
}
```

> El protocolo `opfs-pmtiles://` se registra on-demand desde `OPFSTileSource` (solo cuando se usa mapa desde OPFS).

### E.4 — `OPFSTileSource.ts`: protocolo OPFS → MapLibre

**Archivo**: `frontend/src/infrastructure/maps/protocols/OPFSTileSource.ts`

**MapLibre NO puede leer OPFS directamente.** Se necesita un protocolo personalizado que implemente `getBytes` a partir de un `File` blob de OPFS:

```typescript
import maplibregl from 'maplibre-gl';
import { PMTiles } from 'pmtiles';

let cachedTiles: PMTiles | null = null;

export async function openPMTilesFromOPFS(filename: string): Promise<boolean> {
  try {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle(filename, { create: false });
    const file = await handle.getFile();
    const source = {
      getBytes: async (offset: number, length: number) => {
        const slice = file.slice(offset, offset + length);
        return { data: await slice.arrayBuffer() };
      },
    };
    cachedTiles = new PMTiles(source as any);
    registerOPFSProtocol(maplibregl);
    return true;
  } catch { return false; }
}

function registerOPFSProtocol(maplibregl: typeof import('maplibre-gl')) {
  maplibregl.addProtocol('opfs-pmtiles', async (params, abortController) => {
    if (!cachedTiles) return { data: new ArrayBuffer(0) };
    const [z, x, y] = params.url.replace('opfs-pmtiles://', '').split('/').map(Number);
    const tile = await cachedTiles.getZxy(z, x, y, abortController.signal);
    return { data: tile?.data ?? new ArrayBuffer(0) };
  });
}
```

**Esto es obligatorio**: sin este protocolo, MapLibre nunca leerá los tiles descargados en OPFS.

> ⚠️ **¿Por qué NO se necesita un Service Worker handler para range requests OPFS?**
>
> Una alternativa común es interceptar `fetch('/maps/cuba.pmtiles')` en el SW y responder con slices del archivo OPFS usando `206 Partial Content`. Sin embargo, el plan adopta el enfoque del protocolo `opfs-pmtiles://` porque:
>
> 1. **Eficiencia**: MapLibre hace cientos de tile requests por segundo. Cada request iría al SW, que debe parsear el Range header, leer de OPFS, y responder. Con el protocolo personalizado, las solicitudes van directo al `PMTiles` object en memoria sin pasar por el event loop del SW.
> 2. **Complejidad**: El handler SW requiere parsear cabeceras Range (ej: `bytes=0-4095`) y hacer `file.slice(offset, length)` — exactamente lo mismo que hace `OPFSTileSource.getBytes` pero con overhead de serialización SW.
> 3. **Caché incorrecta**: El SW cachearía accidentalmente las respuestas parciales, llevando a stale data o corrupción.
>
> **Decisión**: El protocolo `opfs-pmtiles://` registrado vía `maplibregl.addProtocol` es la vía correcta para MapLibre + OPFS. No implementar SW range handler.

### E.5 — `cuba-map-style.ts`: estilo JSON completo offline

**Archivo**: `frontend/src/infrastructure/maps/styles/cuba-map-style.ts`

MapLibre necesita un estilo JSON para renderizar. Para offline **sin CDN**:

```typescript
import type { StyleSpecification } from 'maplibre-gl';

type TileSource = 'opfs' | 'server';

export function getCubaMapStyle(source: TileSource): StyleSpecification {
  return {
    version: 8,
    glyphs: '/maps/fonts/{fontstack}/{range}.pbf',
    sprite: '/maps/sprites/sprite',
    sources: {
      'cuba-tiles': {
        type: 'vector',
        tiles: source === 'opfs'
          ? ['opfs-pmtiles://{z}/{x}/{y}']
          : ['pmtiles:///maps/cuba.pmtiles/{z}/{x}/{y}'],
        minzoom: 0,
        maxzoom: 14,
      },
    },
    layers: [
      // -- Capas vectoriales estándar Protomaps --
      { id: 'background', type: 'background', paint: { 'background-color': '#f8f4f0' } },
      // Agua, tierra, vías, edificios, etiquetas según esquema Protomaps
      // Layers definidos una vez, versionados con el código
    ],
  };
}
```

### E.6 — Arquitectura de componentes de mapa

Para garantizar reusabilidad y escalabilidad, el módulo de mapa se organiza en dos componentes principales:

> ⚠️ **Todos los componentes que importan `maplibre-gl` deben ser Client Components (`'use client'`) e importados via `next/dynamic` con `{ ssr: false }`**. MapLibre depende de `window`, `WebGLRenderingContext`, y `document` — rompe en Server Components de Next.js. Ver regla en Reglas de Ejecución.

```typescript
// Jerarquía de componentes
// MapLibreInitializer ─────── registro protocolos (lazy, una vez)
//    │
//    ├── MapPreview ────────── embebido, static/expandible, para cards/forms
//    │      │
//    │      └── MapViewer ──── interactivo view/select, para detalle/selector
//    │             │
//    │             ├── useGeolocation hook (GPS on-demand)
//    │             └── useGeoSearch hook (búsqueda offline geoIndex)
//    │
//    └── MapStatusOverlay ──── overlay estados (no disponible, descargando, error)
```

#### E.6.1 — `MapPreview` (embebido, solo lectura, expandible)

**Archivo**: `frontend/src/presentation/shared/components/map/MapPreview.tsx`

```typescript
interface MapPreviewProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  marker?: { lat: number; lng: number; label?: string };
  className?: string;
  onExpand?: () => void;
  static?: boolean;     // sin controles ni botón expandir
}
```

Características:
- No interactivo si `static=true`
- Botón "Expandir mapa" → abre `MapViewer` en Dialog
- Spinner/skeleton mientras carga tiles
- Fallback "Mapa no disponible" si tiles fallaron
- `min-h-11` en botones, tooltip en expand

#### E.6.2 — `MapViewer` (interactivo, view/select mode)

**Archivo**: `frontend/src/presentation/shared/components/map/MapViewer.tsx`

```typescript
interface MapViewerProps {
  mode: 'view' | 'select';
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  markers?: Array<{ id: string; lat: number; lng: number; label?: string; color?: string }>;
  onLocationSelect?: (coords: { lat: number; lng: number; address?: string }) => void;
  height?: string;        // default: 'h-96'
  showSearch?: boolean;   // barra búsqueda offline
  showLocate?: boolean;   // botón "Mi ubicación" GPS
  showZoomControls?: boolean;
}
```

Características:
- Botón "Mi ubicación" → `useGeolocation` hook, centra mapa en coordenadas GPS con indicador de precisión
- Barra de búsqueda → `useGeoSearch` hook sobre IDB `geoIndex` (offline, debounce 300ms, top 5)
- Zoom +/− con tooltips
- Click para seleccionar en `mode='select'`
- Fallback completo si tiles no disponibles
- Botón **"Compartir ubicación"** → genera link universal compatible (ver E.11)

#### E.6.3 — `useGeoSearch` hook

**Archivo**: `frontend/src/presentation/shared/hooks/map/useGeoSearch.ts`

```typescript
interface GeoSearchResult {
  id: string;
  name: string;
  type: 'province' | 'municipality' | 'city';
  lat: number;
  lng: number;
}

// Busca en IDB geoIndex usando índice by-name (normalizedName)
// Debounce 300ms, retorna top 5 resultados
export function useGeoSearch(query: string): {
  results: GeoSearchResult[];
  loading: boolean;
  error: string | null;
}
```

#### E.6.4 — `MapStatusOverlay` (overlay reutilizable)

**Archivo**: `frontend/src/presentation/shared/components/map/MapStatusOverlay.tsx`

Overlay que muestra según estado:
- "Mapa no disponible" + botón "Descargar mapa desde Settings"
- "Descargando mapa..." + progreso (solo cuando se descarga desde StoragePanel)
- "Búsqueda offline no disponible"
- "Permiso GPS denegado"
- **Sin botón reintentar inline** — la descarga es desde Settings, no desde boot

> ⚠️ `MapStatusOverlay` ya NO incluye flujo de descarga. Solo informa estado y redirige a StoragePanel.

### E.7 — Capacidades del mapa MVP

| Capacidad | Incluida MVP | Componente |
|-----------|-------------|------------|
| Visualización mapa base Cuba | ✅ | `MapPreview` / `MapViewer` |
| Zoom y pan | ✅ | MapLibre nativo |
| Marcador de ubicación | ✅ | `MapPreview` / `MapViewer` |
| `flyTo` programático | ✅ | MapLibre nativo |
| Búsqueda offline provincia/municipio/ciudad | ✅ | `useGeoSearch` + `geoIndex` |
| Ubicación actual on-demand (GPS) | ✅ | `useGeolocation` |
| Selección de coordenadas por click | ✅ | `MapViewer mode='select'` |
| Fallback visual si mapa no disponible | ✅ | `MapStatusOverlay` |
| **Compartir ubicación** (link universal) | ✅ | `MapViewer` botón compartir |
| **Persistencia marcadores en backend** | ✅ | Sync service + endpoint |
| **No incluido aún**: calles completas, rutas/navegación, clustering, edición geométrica, capas temáticas | ❌ | Fase futura |

### E.8 — `useGeolocation.ts` hook

**Archivo**: `frontend/src/presentation/shared/hooks/device/useGeolocation.ts`

Hook con `navigator.geolocation.watchPosition`, caché en IDB `syncMeta`, stale threshold 5min.

> ⚠️ **Geolocalización es on-demand.** Solo se activa cuando el usuario presiona "Mi ubicación" o "Usar ubicación actual". Nunca se solicita durante el boot. Si el permiso es denegado, el mapa y la app siguen funcionando sin degradación.

### E.9 — `MapControls.tsx`: integrar useGeolocation

Reemplazar `mapInstance.locate()` por el hook. Si hay `coords` → `map.flyTo()`. Si no → `startWatching()` + fallback a Leaflet locate.

### E.10 — Índice de búsqueda offline acotado y `geoIndex` loader

**Archivo**: `frontend/src/infrastructure/maps/data/geo-index.ts`

**Alcance MVP** — SOLO:
- País (Cuba)
- Provincias (16) + centro, bbox
- Municipios (~168) + centro, bbox, provincia padre
- Ciudades/localidades principales (~50-100)
- **SIN calles completas** — fase futura

**Fuente oficial**: Backend endpoints bajo `/api/v1/geo/` — `GET /api/v1/geo/provinces?countryCode=CU` devuelve provincias, para cada provincia `GET /api/v1/geo/municipalities/{provinceId}` devuelve municipios. La tabla `geo_regions` (V21) contiene 15 provincias + ~170 municipios (~500KB total). Se importa a IDB store `geoIndex` **después de `ready_partial`** (ver A.12.5), iterando provincias + municipios desde el frontend `GeoRegionRepository` existente. No puede hacerse durante `db_open` — el fetch no ocurre dentro de la transacción de upgrade de IDB.

> **Bundle estático eliminado**: ya no se usa `public/data/geo-cuba.json`. Los datos viven en la DB del servidor y se descargan una sola vez vía API. Si el endpoint no está disponible durante primer arranque sin internet → la búsqueda geográfica simplemente no está disponible hasta que haya conexión. No bloquea boot, no degrada `availability`.

**Fallback si endpoint no disponible**: `geoIndex` queda vacío. `useGeoSearch` retorna `results: []`. `MapStatusOverlay` muestra "Búsqueda offline no disponible". Un efecto en `rehydrate_local` reintenta la carga en background si falló la primera vez (no reintenta más de 3 veces en la misma sesión).

**Estructura del endpoint real** (ejemplo):
```
GET /api/v1/geo/provinces?countryCode=CU
→ [{
    "id": "LA-HABANA",
    "name": "La Habana",
    "code": "CU-03",
    "countryCode": "CU",
    "center": [23.1136, -82.3666],
    "bbox": [-82.5, 22.9, -82.2, 23.3]
  },
  ...]
```
      {
        "type": "Feature",
        "properties": {
          "id": "LA-HABANA",
          "name": "La Habana",
          "type": "province",
          "parentIds": ["CU"],
          "center": [23.1136, -82.3666],
          "bbox": [-82.5, 22.9, -82.2, 23.3]
        },
        "geometry": { "type": "Point", "coordinates": [-82.3666, 23.1136] }
      },
      ...
    ]
  }
```

```typescript
export interface GeoEntry {
  id: string;
  type: 'country' | 'province' | 'municipality' | 'city';
  name: string;
  normalizedName: string;
  aliases: string[];
  parentIds: string[];
  center: [number, number];
  bbox: [number, number, number, number];
  countryCode: string;
}
```

### E.11 — Compartir ubicación (link universal)

**Feature**: Desde `MapViewer`, botón "Compartir ubicación" que genera un link compatible con cualquier plataforma de mapas:

```typescript
export function generateMapShareLink(lat: number, lng: number, label?: string): string {
  const q = label ? encodeURIComponent(label) : `${lat},${lng}`;
  // Google Maps
  // Waze: https://waze.com/ul?ll={lat},{lng}&navigate=yes
  // OpenStreetMap: https://www.openstreetmap.org/?mlat={lat}&mlon={lng}
  // Formato universal: geo:{lat},{lng}?q={lat},{lng}({label})
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
```

UX:
- Botón "Compartir" en `MapViewer` y `MapPreview` (si tiene marcador)
- Abre `navigator.share()` si disponible (mobile), si no copia al portapapeles con Toast "Link copiado"
- El link se abre en Google Maps, Waze o cualquier app de mapas del dispositivo
- Tooltip: "Compartir ubicación"

### E.12 — Persistencia de marcadores/anotaciones en backend

Los marcadores, ubicaciones de warehouses/customers/suppliers y cualquier anotación en el mapa deben persistir al backend:

| Dato | Store IDB | Endpoint backend | Sync |
|------|-----------|------------------|------|
| Ubicación warehouse | `warehouses` (lat/lng fields) | `PUT /api/v1/warehouses/{id}/location` | Tipo A (normal) |
| Ubicación customer | `customers` (lat/lng fields) | `PUT /api/v1/customers/{id}/location` | Tipo A (normal) |
| Marcadores personalizados | `mapMarkers` (nuevo store) | `POST/GET /api/v1/map-markers` | Tipo A (normal) |
| Anotaciones de mapa | `mapAnnotations` (nuevo store) | `POST/GET /api/v1/map-annotations` | Tipo A (normal) |

**Nuevos stores IDB** (en v5, agregar si no existen):

```typescript
// mapMarkers store (opcional, agregar en v5 ya que el plan ya usa v5)
// Si no se agregan en v5, agregar en migración futura v6
interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  entityType?: 'warehouse' | 'customer' | 'supplier' | 'custom';
  entityId?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  version: number;
}
```

**Comportamiento**: mismas reglas que escrituras Tipo A — guardado local inmediato, marcado como pending sync, push al backend cuando haya conexión. No merge silencioso.

### E.13 — Descarga de mapa desde Settings (StoragePanel)

**Cambio crítico**: la descarga del PMTiles **NO ocurre durante `map_tiles` boot phase**. En su lugar:

1. `map_tiles` phase en boot solo verifica si OPFS contiene `cuba.pmtiles` con checksum válido
2. Si no existe o está corrupto → `availability = 'degraded'`, `MapStatusOverlay` muestra "Mapa no disponible. Descargar desde Configuración"
3. Desde **StoragePanel** (Settings), el usuario puede:
    - Ver estado del mapa (instalado?, versión, tamaño, checksum, fecha)
    - Pulsar "Descargar mapa" que inicia el flujo de streaming OPFS
    - Ver progreso de descarga con barra y % (puede cerrar y continuar en background)
    - Cancelar descarga en curso
4. La descarga usa el mismo streaming OPFS definido en E.14

> ⚠️ **¿Primer arranque auto o manual? Regla definitiva**:
> - **Primer arranque** (sin PMTiles local): `map_tiles` phase intenta descargar automáticamente en background (non-fatal usando `downloadMapToOPFS`). Si la descarga automática falla (ej: servidor de mapa no responde, red lenta), NO bloquea boot — la app sigue en `ready_partial`/`degraded` y el usuario puede reintentar manualmente desde StoragePanel.
> - **Arranques posteriores** (PMTiles existe localmente): `map_tiles` solo verifica checksum. No descarga automática.
> - **Descarga manual** desde StoragePanel: siempre sobrescribe con confirmación previa. Si hay descarga automática en curso, el botón manual muestra "Descarga en progreso...".
> - **Regla**: La descarga automática en primer arranque es **best-effort, non-blocking, non-fatal**. Si falla, no hay impacto en availability más allá de `degraded` por mapa faltante.
> - **Coordinación con `isMapDownloading`**: Antes de cualquier descarga automática (primer arranque) o manual, verificar `schedulerState.isMapDownloading === false`. Si ya está activo (otra tab descargando o descarga previa en curso), saltar el intento. La descarga automática de primer arranque solo se inicia si `isMapDownloading === false` y respeta el mismo mutex que la descarga manual.

**⚠️ Mutex de descarga**: Antes de iniciar cualquier descarga (boot o manual), verificar el flag global `isMapDownloading: boolean` en Zustand store. Si está activo, mostrar "Descarga en progreso..." en el botón y no iniciar nueva descarga. Esto evita conflicto entre StoragePanel manual y cualquier intento de descarga desde boot. El flag se setea al iniciar y se limpia al terminar (éxito o error).

### E.14 — Streaming OPFS + checksum + rename atómico

**Flujo ejecutado desde StoragePanel** (NO desde boot loader):

```typescript
async function downloadMapToOPFS(onProgress: (pct: number) => void): Promise<void> {
  const res = await fetch('/api/v1/maps/cuba.pmtiles');
  if (!res.ok || !res.body) throw new Error('ERR_MAP_PMTILES_DOWNLOAD');

  const contentLength = Number(res.headers.get('content-length') ?? 0);
  const root = await navigator.storage.getDirectory();
  const handle = await root.getFileHandle('cuba.pmtiles.tmp', { create: true });
  const writable = await handle.createWritable();
  const reader = res.body.getReader();
  let received = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      await writable.write(value);           // streaming directo — sin buffer en RAM
      received += value.length;
      if (contentLength > 0) onProgress(Math.round(received / contentLength * 100));
    }
    await writable.close();

    // Validar checksum contra endpoint sha256 del backend
    const file = await handle.getFile();
    const buf = await file.arrayBuffer();
    const hashBuf = await crypto.subtle.digest('SHA-256', buf);
    const hex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    const metaRes = await fetch('/api/v1/maps/cuba.pmtiles.meta.json');
    const meta = await metaRes.json() as { sha256: string };
    const expected = meta.sha256;
    if (`sha256:${hex}` !== expected) {
      await root.removeEntry('cuba.pmtiles.tmp');
      throw Object.assign(new Error('ERR_MAP_CHECKSUM_MISMATCH'), { errorCode: 'ERR_MAP_CHECKSUM_MISMATCH' });
    }

    // Reemplazo atómico: .tmp → .pmtiles
    // OPFS no tiene rename universal — fallback: copiar y borrar
    const destHandle = await root.getFileHandle('cuba.pmtiles', { create: true });
    const destWritable = await destHandle.createWritable();
    const reader2 = file.stream().getReader();
    while (true) {
      const { done, value } = await reader2.read();
      if (done) break;
      await destWritable.write(value);
    }
    await destWritable.close();
    await root.removeEntry('cuba.pmtiles.tmp');

    // Guardar metadata
    const db = await openDB('inventory-offline', 5);
    await db.put('syncMeta', {
      key: 'map-pmtiles',
      filename: 'cuba.pmtiles',
      size: file.size,
      installedAt: Date.now(),
      version: '1.0',
      checksum: `sha256:${hex}`,
    });
  } catch (err) {
    await writable.abort().catch(() => {});
    await root.removeEntry('cuba.pmtiles.tmp').catch(() => {});
    throw err;
  }
}
```

> ⚠️ `FileSystemWritableFileStream` no tiene `rename()`. El fallback de copiar el archivo temporal al definitivo duplica temporalmente el espacio usado. Para PMTiles de ~100MB, asegurar ~200MB libres durante la descarga.

### E.15 — Fase `map_tiles` en boot (solo verificación)

La fase `map_tiles` en `useAppLoader.ts` cambia de "descargar" a "verificar":

```typescript
useEffect(() => {
  if (store.phase !== 'map_tiles') return;
  (async () => {
    try {
      const meta = await getMapMeta(); // desde syncMeta
      const root = await navigator.storage.getDirectory();
      const exists = meta?.installedAt && await root
        .getFileHandle('cuba.pmtiles', { create: false }).then(() => true).catch(() => false);
      if (exists) {
        // Verificar checksum contra metadata guardada y servidor
        const serverMetaRes = await fetch('/api/v1/maps/cuba.pmtiles.meta.json').catch(() => null);
        const serverMeta = serverMetaRes?.ok ? await serverMetaRes.json() as { sha256: string } : null;
        if (serverMeta && serverMeta.sha256 !== meta.checksum) {
          appLogger.info('[AppLoader] nueva versión de mapa disponible, marcar stale');
          // No marcar degraded — solo badge "Nueva versión disponible" en StoragePanel
        }
        // Verificar integridad del archivo local
        const file = await (await root.getFileHandle('cuba.pmtiles')).getFile();
        const buf = await file.arrayBuffer();
        const hashBuf = await crypto.subtle.digest('SHA-256', buf);
        const hex = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
        if (`sha256:${hex}` !== meta.checksum) {
          appLogger.warn('[AppLoader] map checksum mismatch, archivo corrupto');
          setAvailability('degraded');
        }
      } else {
        appLogger.info('[AppLoader] mapa no descargado — disponible desde Settings');
        // No marcar degraded aquí solo por mapa faltante — es acción manual
      }
    } catch { /* non-fatal */ }
    finally { setPhase('precache_routes'); }
  })();
}, [store.phase, setPhase, setAvailability, setSubStep]);
```

### E.16 — `next.config.ts`: headers para assets de mapa

```typescript
headers: async () => [
  // ... existing headers ...
  {
    // Assets pequeños de mapa (fonts, sprites, style) — servidos por Next.js
    source: '/maps/:file*',
    headers: [
      { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
    ],
  },
],
```

> ⚠️ El PMTiles se sirve desde Spring Boot (`/api/v1/maps/cuba.pmtiles`), no desde Next.js. El `Accept-Ranges` lo maneja Spring Boot automáticamente con `ResourceHttpRequestHandler`.

### E.17 — SW precache de assets de mapa

Agregar al manifiesto de precache de Serwist:
- `/maps/style.json`
- `/maps/fonts/NotoSansRegular/0-255.pbf`
- `/maps/fonts/NotoSansBold/0-255.pbf`
- `/maps/sprites/sprite.json`
- `/maps/sprites/sprite.png`
- `/~offline` (shell offline)

### ADR: Leaflet → MapLibre — criterio de retiro

Dejar nota en `docs_dev/adr-map-migration.md`:

> **Criterio de retiro de Leaflet:**
> Eliminar componente Leaflet (`OfflineMap.tsx`, `CubaTileManager.ts`, `CubaGeoSearchAdapter.ts`) CUANDO:
> - MapLibre renderice todos los casos de uso actuales (puntos, selección de ubicación, map view)
> - GPS offline funcione en MapLibre
> - Búsqueda offline funcione en geocoder MapLibre
> - Edición/selección de ubicación funcione en MapLibre
> - Compartir ubicación funcione en MapLibre
> - Pruebas offline E2E con MapLibre pasen
> - **MapLibre esté en producción validado ≥ 2 semanas sin regresiones reportadas**
> 
> **Fase de retiro**: Fase E.cleanup — eliminar dependencias `react-leaflet`, `leaflet.vectorgrid` de `package.json` y archivos heredados.

### E.18 — Gestión de versiones del mapa (MapMetadata)

**Problema**: El plan verifica si `cuba.pmtiles` existe en OPFS, pero **no detecta si el servidor tiene una versión más reciente**. Si el PMTiles del servidor se actualiza, el cliente nunca lo sabrá mientras el archivo local exista.

**Solución**: Metadata versionada + endpoint `.meta.json`:

```typescript
// IDB syncMeta key: 'map-pmtiles'
interface MapMetadata {
  key: 'map-pmtiles';
  filename: string;            // 'cuba.pmtiles'
  version: string;             // fecha ISO o semver, ej: '2026-06'
  serverChecksum: string;      // SHA-256 del archivo en servidor
  clientChecksum: string;      // SHA-256 del archivo descargado localmente
  sizeBytes: number;
  installedAt: number;         // Date.now() de la descarga
}
```

**Servidor**: Archivo estático `public/maps/cuba.pmtiles.meta.json`:

```json
{
  "version": "2026-06",
  "sha256": "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "sizeBytes": 87654321,
  "updatedAt": "2026-06-15T10:00:00Z"
}
```

**Flujo en `map_tiles` (boot)**:
1. Fetch `/maps/cuba.pmtiles.meta.json`
2. Comparar `serverChecksum` vs metadata guardada en `syncMeta`
3. Si `serverChecksum !== clientChecksum` → metadata marcada como `stale` (no borrar, solo notificar)
4. Si `opfsFileExists('cuba.pmtiles')` pero **no hay metadata** → re-descargar (archivo huérfano = corrupción implícita)
5. Si hay versión nueva disponible → badge/banner: "Nueva versión de mapa disponible" + enlace a StoragePanel

**No forzar re-descarga automática** — el usuario decide desde StoragePanel cuándo actualizar. El PMTiles es grande (~80-150MB), la actualización es manual como la descarga inicial.

### E.19 — Notas de rendimiento SHA-256 en archivos grandes

Para PMTiles de ~100-200MB, `crypto.subtle.digest('SHA-256', arrayBuffer)` en **main thread** puede tardar ~1-3s. Esto afecta:
- `map_tiles` boot phase (verificación de checksum) → aceptable, no bloquea UI porque corre después de `ready_partial`
- `StoragePanel` post-descarga (validación) → aceptable, el usuario ve "Verificando integridad..." en progreso

**Mejora futura documentada**: Mover `crypto.subtle.digest` a Web Worker si la verificación causa jank perceptible en dispositivos de gama baja. Usar `FileSystemSyncAccessHandle` en Worker para evitar cargar el archivo completo en memoria.

### E.20 — Mapa: responsabilidades por servidor

| Recurso | Servido por | URL | Range support | Cache | Notas |
|---------|-------------|-----|---------------|-------|-------|
| `cuba.pmtiles` | Spring Boot `ResourceHttpRequestHandler` | `GET /api/v1/maps/cuba.pmtiles` | ✅ Automático WebFlux + FileSystemResource | `immutable` | Archivo en directorio externo configurable (`app.maps.location`), NO en JAR |
| `cuba.pmtiles.sha256` | Spring Boot | `GET /api/v1/maps/cuba.pmtiles.sha256` | ❌ | `no-cache` | Inline o archivo separado |
| `cuba.pmtiles.meta.json` | Spring Boot | `GET /api/v1/maps/cuba.pmtiles.meta.json` | ❌ | `no-cache` | Version metadata |
| Imágenes productos/proveedores | Spring Boot | `GET /api/v1/images/**` | ✅ Automático | `public, max-age=86400` | Streaming + ETag + 304 |
| Assets JS/CSS | Next.js build | Archivos compilados | ✅ Automático | `immutable` (content hash) | — |
| Assets mapa (fonts, sprites, style) | Next.js `/public/maps/` | `/maps/fonts/...`, etc. | ❌ | `immutable` | Precacheados via Serwist |

### Files Summary E

| Archivo | Acción |
|---------|--------|
| `frontend/package.json` | +maplibre-gl, @maplibre/maplibre-gl-geocoder |
| `frontend/src/infrastructure/maps/MapLibreInitializer.ts` | Nuevo — registro protocolos pmtiles:// (lazy, una vez) |
| `frontend/src/infrastructure/maps/protocols/OPFSTileSource.ts` | Nuevo — protocolo opfs-pmtiles:// → OPFS File → MapLibre |
| `frontend/src/infrastructure/maps/styles/cuba-map-style.ts` | Nuevo — estilo JSON completo offline con layers vectoriales |
| `frontend/src/presentation/shared/components/map/MapPreview.tsx` | Nuevo — mapa embebido static/expandible |
| `frontend/src/presentation/shared/components/map/MapViewer.tsx` | Nuevo — mapa interactivo view/select + compartir |
| `frontend/src/presentation/shared/components/map/MapStatusOverlay.tsx` | Nuevo — overlay estados (no disponible, descargando, error) |
| `frontend/src/presentation/shared/hooks/map/useGeoSearch.ts` | Nuevo — búsqueda offline sobre geoIndex IDB (debounce 300ms) |
| `frontend/src/infrastructure/maps/data/geo-index.ts` | Nuevo — gazetteer offline (acotado MVP) |
| `frontend/src/presentation/shared/hooks/device/useGeolocation.ts` | Nuevo — GPS offline hook |
| `frontend/src/presentation/shared/components/storage/StoragePanel.tsx` | Nuevo — flujo descarga mapa desde Settings (progreso, cancelar) |
| `frontend/src/presentation/shared/components/map/MapControls.tsx` | Usar `useGeolocation` + flyTo |
| `frontend/next.config.ts` | Headers Accept-Ranges para /maps/ |
| `frontend/src/app/api/maps/[...path]/route.ts` (Opcional) | API Route Next.js que proxy a backend `/api/v1/maps/*` solo si Leaflet fallback requiere servir PMTiles desde el mismo origen durante transición. MapLibre final usa `pmtiles://` + `opfs-pmtiles://` directamente, sin Next.js proxy. |
| `app.maps.location` (configurable) | PMTiles (~60-150MB) + SHA-256 + metadata JSON en directorio externo al JAR. **NO en resources/static/**, NO en frontend/public/. El archivo se coloca manualmente antes del deploy (no en git por su tamaño). |
| `frontend/public/maps/cuba.pmtiles.meta.json` | Metadata versionada (version, sha256, size, updatedAt) |
| `frontend/public/maps/style.json` | Estilo MapLibre para Cuba |
| `frontend/public/maps/fonts/NotoSansRegular/0-255.pbf` | Fuente etiquetas |
| `frontend/public/maps/fonts/NotoSansBold/0-255.pbf` | Fuente bold etiquetas |
| `frontend/public/maps/sprites/sprite.json` + `sprite.png` | Sprites iconos |
| `frontend/src/app/serwist/[path]/route.ts` | +precache assets mapa (fonts, sprites, style, shell) |
| `docs_dev/adr-map-migration.md` | ADR Leaflet→MapLibre + criterio de retiro |

**Verificación:**
```bash
cd frontend && pnpm exec tsc --noEmit && pnpm lint
```

---

## Fase G — Estrategia de Imágenes Offline

> **Skills**: `senior-frontend`, `hexagonal-architecture`, `tailwind-patterns`
> **Objetivo**: Implementar sistema completo de imágenes offline con tres niveles (thumbnail/preview/full-resolution), almacenamiento en OPFS, metadatos en IDB `imageIndex`, y componentes UI reutilizables.
> **Por qué aquí**: Las imágenes son el gap más grande del plan — ausentes completamente. Dependen del schema IDB v5 (Fase A), del DownloadQueueService (Fase B) y del loader (Fase C).

### G.1 — Restricciones de contexto

| Restricción | Implicación |
|-------------|-------------|
| Servidor local sin internet | Las imágenes se sirven SOLO desde `http://localhost:PORT/api/v1/images/...` |
| Sin degradación de calidad | **Cero compresión frontend.** Thumbnails los genera el backend en upload, no el cliente. |
| Hasta 10 imágenes por entidad | Hasta 100MB por producto si todas son 10MB. NO se pueden precargar todas. |
| Servidor Spring Boot WebFlux | Puede servir archivos con streaming y `Accept-Ranges` |
| Capturas/fotos con datos importantes | No WebP en calidad reducida. Mantener formato original (JPEG/PNG) sin reencoding. |

### G.1.1 — Fallback cuando OPFS no está disponible para imágenes

**Problema**: Firefox Private Mode, Safari ≤ 16 y algunos contextos (iOS WebView, Brave Shields estrictos) no soportan OPFS o tienen acceso limitado. El plan actual asume OPFS como mecanismo de cache de imágenes, pero sin fallback explícito la app puede romper offline.

**Comportamiento definido**:

```typescript
// Detector de disponibilidad OPFS para imágenes
async function isOPFSAvailable(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.getDirectory) return false;
  try {
    const root = await navigator.storage.getDirectory();
    await root.getFileHandle('__img_probe__', { create: true });
    await root.removeEntry('__img_probe__');
    return true;
  } catch { return false; }
}
```

| Condición | Comportamiento |
|-----------|---------------|
| OPFS disponible | Normal: imágenes se cachean en OPFS y se sirven offline via `ImageResolver` + `useImageCache` |
| OPFS no disponible | **No degradar `availability`.** Imágenes se sirven siempre desde backend (sin cache local). `appLogger.warn` al detectar. |
| OPFS no disponible + offline | Imágenes no disponibles. `<OfflineImage>` muestra placeholder. Sin fallback adicional. |
| OPFS no disponible + online | Imágenes se cargan desde backend en cada request. Sin cache. Performance aceptable en LAN. |

**Implementación**:
1. `ImageResolver.ts` y `useImageCache.ts` deben llamar a `isOPFSAvailable()` antes de intentar leer/escribir OPFS
2. Si OPFS no disponible, `resolveImageUrl()` retorna `null` inmediatamente (no intentar cachear)
3. Hook `useImageCache()` devuelve `isFromCache: false` y hace fetch directo al backend si hay conexión
4. El detector se ejecuta una vez durante `rehydrate_local` y se cachea en variable global

**Auditoría asociada**: Durante `rehydrate_local` o `db_open`, ejecutar auditoría OPFS para imágenes. Si falla → audit diagnóstica, no afecta availability. La app funciona sin cache de imágenes.

### G.2 — Modelo de tres niveles

| Nivel | Tamaño | Almacenamiento | Carga |
|-------|--------|---------------|-------|
| **Thumbnail** | ≤100KB | OPFS `images/{entityType}/{id}_thumb_{imageId}.jpg` | Eager prefetch via image_prefetch background task |
| **Preview** | ≤500KB | OPFS `images/{entityType}/{id}_preview_{imageId}.jpg` | Lazy on first open (modal de detalle) |
| **Full-resolution** | ≤10MB | OPFS `images/{entityType}/{id}_full_{imageId}.jpg` | On-demand solo cuando usuario abre imagen a tamaño completo |

> El backend ya genera `thumbnail_path` en upload. El cliente usa ese path directamente. **No reencoding, no compresión**.

### G.3 — Endpoint de imágenes en backend

**Archivo**: `backend/.../controllers/ImageController.java`

```java
@GetMapping("/api/v1/images/**")
public Mono<ResponseEntity<Resource>> serveImage(ServerHttpRequest request) {
    String path = /* extraer path del wildcard */;
    Resource resource = new FileSystemResource(UPLOAD_DIR + path);
    if (!resource.exists()) return Mono.just(ResponseEntity.notFound().build());

    return Mono.just(ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_TYPE, detectMimeType(path))
        .header(HttpHeaders.CACHE_CONTROL, "private, max-age=86400")
        .header(HttpHeaders.ETAG, computeETag(resource))   // validación condicional If-None-Match → 304
        .header(HttpHeaders.ACCEPT_RANGES, "bytes")         // streaming
        .header(HttpHeaders.CONTENT_DISPOSITION, "inline")  // vista previa, no descarga
        .body(resource));
}
```

> No agregar compresión HTTP a imágenes JPEG/PNG: ya están comprimidas internamente. Comprimir en HTTP solo añade CPU sin reducir tamaño.

### G.4 — Generación de thumbnails en upload (backend)

**Archivo**: `backend/.../services/ImageService.java`

Verificar que el backend genera thumbnails correctamente en upload. Si no, usar Thumbnailator:

```java
// En ImageService.java al hacer upload:
// 1. Guardar original sin modificar
// 2. Generar thumbnail (200x200) SIN DEGRADAR calidad si imagen es pequeña
//    Si imagen ya es < 200px, usar como thumbnail directamente
// NUNCA recomprimir JPEG por encima del original

Thumbnails.of(originalFile)
    .size(200, 200)
    .keepAspectRatio(true)
    .outputQuality(0.95)  // 95% — mínima pérdida perceptible
    .toFile(thumbnailFile);
```

Si Thumbnailator no está en el proyecto, agregar dependencia:
```xml
<dependency>
    <groupId>net.coobird</groupId>
    <artifactId>thumbnailator</artifactId>
    <version>0.4.20</version>
</dependency>
```

### G.4.5 — `ImageResolver` service: intercepta rutas de API y resuelve desde OPFS

**Archivo**: `frontend/src/infrastructure/images/ImageResolver.ts`

**Problema**: La app renderiza `<img src="/api/v1/products/{uuid}/images/0">` en componentes como `ProductCard`. Offline, esas URLs fallan porque el backend no responde. Se necesita interceptar la resolución y servir desde OPFS si existe.

```typescript
// ImageResolver — traduce rutas de API a ObjectURLs de OPFS
// Patrón: encapsular en función, usar en <OfflineImage> como fallback

const IMAGE_PATH_REGEX = /^\/api\/v1\/(products|suppliers|customers)\/([^/]+)\/images\/(\d+)$/;

export async function resolveImageUrl(apiPath: string): Promise<string | null> {
  // 1. Extraer entityType, entityId, imageIndex del path
  const match = apiPath.match(IMAGE_PATH_REGEX);
  if (!match) return null;
  const [, entityType, entityId, imageIndex] = match;

  // 2. Construir key de imageIndex: {entityType}/{entityId}/{imageIndex}_thumbnail
  const imageKey = `${entityType}/${entityId}/${imageIndex}_thumbnail`;

  // 3. Buscar en imageIndex
  const db = await openDB('inventory-offline', 5);
  const entry = await db.getFromIndex('imageIndex', 'by-entity', [entityType, entityId]);

  if (entry) {
    // 4. Leer blob de OPFS y crear ObjectURL
    const buf = await readOPFSFile(entry.opfsPath);
    if (buf) {
      return URL.createObjectURL(new Blob([buf], { type: entry.contentType }));
    }
  }
  return null;  // no cacheado — componente muestra placeholder
}

// Cleanup helper para revocar ObjectURLs (llamar en useEffect return)
// Guardar URLs generadas en un Set y revocar al desmontar
```

**Integración con `<OfflineImage>`**: El componente intenta resolver la URL via `ImageResolver` primero. Si falla y hay red, hace fetch normal. Si falla todo, muestra placeholder.

### G.4.6 — `useImageUrl` hook: convierte path relativo a ObjectURL offline

**Archivo**: `frontend/src/presentation/shared/hooks/images/useImageUrl.ts`

Hook de alto nivel que usa `resolveImageUrl` internamente con manejo de ciclo de vida:

```typescript
export function useImageUrl(relativePath: string | null): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!relativePath) return;
    let cancelled = false;

    (async () => {
      const url = await resolveImageUrl(relativePath);
      if (!cancelled) setObjectUrl(url);
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [relativePath]);

  return objectUrl;
}
```

> ⚠️ **URL.revokeObjectURL obligatorio**: Cada ObjectURL es una referencia a un blob en memoria. Sin revoke, cada imagen offline crea un leak que nunca se libera. El cleanup en `useEffect` garantiza que se revoquen al cambiar el path o desmontar el componente.

### G.4.7 — Escrituras offline con imágenes (outbox + blobs OPFS)

**Problema**: Si el usuario crea un producto offline con fotos, las imágenes deben ir al outbox como blobs separados o referencias a OPFS, no solo el metadata JSON.

**Solución**:

```typescript
// Estructura de outbox para escrituras con imágenes:
interface OutboxEntry {
  id: string;
  entityType: 'product' | 'supplier' | 'customer';
  entityId: string;
  operation: 'create' | 'update';
  payload: Record<string, unknown>;       // JSON del DTO (sin blobs)
  imageBlobs: Array<{                     // 🆕 blobs de imágenes
    tempKey: string;                       // key temporal en OPFS
    opfsPath: string;                      // ruta en OPFS del blob
    originalFilename: string;
    contentType: string;
    size: number;
  }>;
  createdAt: number;
  syncStatus: 'pending' | 'syncing' | 'failed' | 'completed';
}

// Flujo de push:
// 1. Fetch POST /api/v1/products con payload JSON + metadata de imágenes
// 2. Para cada imagen en imageBlobs:
//    a. Si backend acepta: leer de OPFS y hacer POST /api/v1/images/upload
//    b. Si falla: marcar como failed, no reintentar automáticamente
//       (la imagen sigue en OPFS, se reintenta manual o con retry limitado)
// 3. Si todo ok: limpiar OPFS temporales, marcar outbox como completed
// COMPORTAMIENTO: mismo que Tipo A — guardado local inmediato, push diferido
```

**Decisión**: En MVP, las imágenes offline se guardan en OPFS y se referencian en outbox. No se implementa lazy upload con progreso. Si hay varias imágenes, se suben secuencialmente (máximo 10).

### G.5 — Store `imageIndex` en IDB (solo metadatos, blobs en OPFS)

Definido en A.3: reemplazar `imageCache` (store genérico en IDB) por `imageIndex` con metadatos ligeros:

```typescript
interface ImageCacheEntry {
  key: string;          // `{entityType}/{entityId}/{imageId}_{size}`
  entityType: string;   // 'product' | 'supplier' | 'customer'
  entityId: string;
  imageId: string;
  size: 'thumbnail' | 'preview' | 'full';
  opfsPath: string;     // path relativo en OPFS
  contentType: string;
  sizeBytes: number;
  cachedAt: number;
  lastAccessedAt: number;
  checksum: string;     // SHA-256 del blob
}
```

> ⚠️ `key` es el keyPath de la store. Se construye como `{entityType}/{entityId}/{imageId}_{size}` para permitir búsquedas by-entity rápidas. Los índices `by-entity`, `by-last-access` y `by-size` se crean en A.3.

### G.6 — `useImageCache` hook

**Archivo**: `frontend/src/infrastructure/images/useImageCache.ts`

```typescript
interface UseImageCacheReturn {
  src: string | null;        // object URL o null
  loading: boolean;
  error: string | null;
  isFromCache: boolean;
}

export function useImageCache(
  imageKey: string | null | undefined,
  options: { size: 'thumbnail' | 'preview' | 'full' } = { size: 'thumbnail' }
): UseImageCacheReturn {
  // 1. Intentar OPFS → si existe, crear ObjectURL y devolver
  // 2. Si no existe y online → fetch /api/v1/images/{key} → guardar OPFS → actualizar imageIndex → servir
  // 3. Si offline → devolver null (componente muestra placeholder)
  // Cleanup: revocar ObjectURL en return de useEffect
  //
  // ⚠️ Cleanup OBLIGATORIO — sin revoke, cada ObjectURL es un memory leak:
  // const [objectUrl, setObjectUrl] = useState<string | null>(null);
  // useEffect(() => {
  //   ...
  //   return () => {
  //     if (objectUrl) URL.revokeObjectURL(objectUrl);
  //   };
  // }, [imageKey, options.size]);
}
```

Crítico: `URL.revokeObjectURL()` en el cleanup del `useEffect` — sin esto, cada imagen crea un leak de memoria.

### G.7 — Componente `<OfflineImage>`

**Archivo**: `frontend/src/presentation/shared/components/media/OfflineImage.tsx`

```tsx
interface OfflineImageProps {
  imageKey: string | null | undefined;
  alt: string;
  size?: 'thumbnail' | 'preview' | 'full';
  className?: string;
  fallbackIcon?: React.ReactNode;
}

// Estados: loading → Skeleton, error/offline → placeholder con icono, success → <img>
// NO loading="lazy" en thumbnails — ya se sirven desde OPFS/cache
// NO width/height que restrinja calidad — usar CSS object-fit
```

### G.8 — Componente `<ImageGallery>`

**Archivo**: `frontend/src/presentation/shared/components/media/ImageGallery.tsx`

Para detalle de producto/proveedor con hasta 10 imágenes. Usa `OfflineImage` internamente:

```tsx
interface ImageGalleryProps {
  images: ProductImage[];     // {id, thumbnailPath, filePath, sortOrder, isPrimary}
  entityType: 'product' | 'supplier' | 'customer';
  entityId: string;
}
// Click en thumbnail → carga preview/full-resolution lazy
// Usa Dialog genérico existente para lightbox
```

### G.9 — LRU eviction en OPFS

El pruning programado (sección Política de Mantenimiento) incluye evicción LRU de imágenes:

```typescript
async function evictImageCacheIfNeeded(): Promise<void> {
  const MAX_IMAGE_CACHE_BYTES = 100 * 1024 * 1024; // 100MB
  const db = await openDB('inventory-offline', 5);
  const index = db.transaction('imageIndex').store.index('by-last-access');

  // Calcular uso total desde metadatos
  let totalBytes = 0;
  const allEntries: ImageCacheEntry[] = await db.getAllFromIndex('imageIndex', 'by-last-access');
  allEntries.forEach(e => { totalBytes += e.sizeBytes; });
  if (totalBytes <= MAX_IMAGE_CACHE_BYTES) return;

  // LRU: eliminar menos accedidas hasta estar dentro del límite
  let freed = 0;
  for (const entry of allEntries) { // ordenado por lastAccessedAt ASC
    if (totalBytes - freed <= MAX_IMAGE_CACHE_BYTES) break;
    await deleteOPFSFile(entry.opfsPath).catch(() => {});
    await db.delete('imageIndex', entry.key);
    freed += entry.sizeBytes;
  }
}
```

### G.10 — Flujo completo de cache de imágenes

```
Usuario abre lista de productos
  │
  ↓ render con <OfflineImage imageKey={product.mainImage}>
  │
  ├─ ¿Existe en OPFS? → ObjectURL desde OPFS (offline/online)
  │
  └─ No existe →
        ├─ Online: fetch /api/v1/images/{key} → arrayBuffer →
        │          write OPFS → update imageIndex → ObjectURL
        └─ Offline: mostrar placeholder (fallbackIcon)
```

### G.11 — Mejora futura documentada

- **Web Worker para operaciones IDB pesadas**: cuando el dataset supere ~10k registros, mover `downloadEntityPaginated` y `evictImageCacheIfNeeded` a un Dedicated Worker para evitar jank en main thread. Las escrituras masivas en IDB en main thread pueden causar jank perceptible.
- **Checksum incremental durante stream**: si el PMTiles crece o hay presión de memoria en gama baja, migrar el checksum SHA-256 del archivo temporal `arrayBuffer()` a un cálculo incremental usando Web Crypto Subtle + `ReadableStream` o Worker. No implementar en MVP.

### Files Summary G

| Archivo | Acción |
|---------|--------|
| Backend `ImageController.java` | Nuevo — servir imágenes con streaming + ETag + Accept-Ranges |
| Backend `ImageService.java` | Verificar/generar thumbnails con Thumbnailator |
| Backend `pom.xml` | +thumbnailator dependencia |
| `frontend/src/infrastructure/images/useImageCache.ts` | Nuevo — hook de cache de imágenes + objectURL desde OPFS |
| `frontend/src/infrastructure/images/ImageResolver.ts` | Nuevo — intercepta rutas /api/v1/.../images/... y resuelve desde OPFS |
| `frontend/src/presentation/shared/hooks/images/useImageUrl.ts` | Nuevo — hook sobre ImageResolver con revokeObjectURL automático |
| `frontend/src/presentation/shared/components/media/OfflineImage.tsx` | Nuevo — componente de imagen offline que usa ImageResolver |
| `frontend/src/presentation/shared/components/media/ImageGallery.tsx` | Nuevo — galería de imágenes con lightbox usando OfflineImage |
| `frontend/src/infrastructure/sync/SyncService.ts` | Modificado — outbox con prioridad Tipo B > Tipo A |
| Backend `PushResultDto.java` | Modificado — serverPayload + entityType + entityId + errorCode + versiones |

**Verificación:**
```bash
cd frontend && pnpm exec tsc --noEmit && pnpm lint
cd backend/inventory-app && mvn compile -q
```

---

## Fase F — Verificación end-to-end

> **Skills**: `webapp-testing`, `senior-frontend`

### F.1 — Checklist de verificación

```
□ IDB v5: DevTools → Application → IndexedDB → inventory-offline, version 5
□ Stores: products (>0), warehouses, categories, customers, suppliers, stockBalances (>0)
□ corruptionQueue: vacío en carga limpia
□ downloadChunks: vacío después de carga completa
□ appLogs: entries visibles en AppLogViewer (dev), <5000 entradas
□ geoIndex: provincias + municipios + ciudades cargados
□ OPFS: cuba.pmtiles presente (DevTools → Application → Storage → OPFS)
□ MapLibre GL JS carga en MapView (dynamic import, ssr: false)
□ Botón "Mi ubicación" solicita permiso GPS → flyTo coordenadas
□ Geocoder offline busca "La Habana", "Santiago" sin internet
□ En DevTools → Network → Offline:
    □ App carga datos desde IDB (TanStack Query → local repos)
    □ Mapa carga desde OPFS / public/maps/
    □ Búsqueda geográfica funciona offline
    □ Navegación shell funciona (solo /~offline precacheadas, el resto desde IDB)
□ rehydrate_local: ready_partial si warehouses > 0 && products > 0 && stockBalances > 0 (categories no bloquean)
□ ready_complete: app usable ANTES de que termine map_tiles
□ degraded: si mapa falla, app sigue usable
□ Simular conflicto: 2 tabs, editar mismo producto → FieldDiffTable visible
□ Simular corrupción: interceptar response → JSON malformado → CorruptionRepairCenter
□ Log viewer visible en development (bottom-right)
□ Logout → no quedan datos sensibles cacheados
□ Phase y availability separados en Zustand store
□ Budgets: cold start < 2s, geo search < 100ms, geo-index < 500KB
□ image_prefetch background task descarga thumbnails (primeros 50 productos)
□ imageIndex store en IDB con by-entity, by-last-access, by-size
□ OPFS contiene imágenes de productos/proveedores
□ OfflineImage muestra placeholder cuando imagen no está cacheada
□ <OfflineImage> transiciones: loading→Skeleton, error→fallbackIcon, success→img
□ ImageGallery con lightbox modal usando Dialog genérico
□ Backend /api/v1/images/** responde con ETag + Accept-Ranges + 304 en validación condicional
□ Backend genera thumbnails en upload (Thumbnailator, quality 0.95, 200x200)
□ LRU eviction de imageIndex cuando supera 100MB (por lastAccessedAt)
□ downloadChunks filtrado por userId (evitar cross-user interference)
□ geoIndex poblado desde endpoints backend /api/v1/geo/provinces + /api/v1/geo/municipalities/{id} post-ready_partial (no en db_open)
□ MapLibreInitializer registra protocolo pmtiles:// (lazy, single init)
□ OPFSTileSource: opfs-pmtiles:// protocolo lee PMTiles desde OPFS
□ cuba-map-style.ts genera estilo con source 'opfs' o 'server'
□ MapPreview: embebido, static, expandible a MapViewer en Dialog
□ MapViewer: mode view/select, markers, búsqueda offline, GPS, zoom controls
□ useGeoSearch: debounce 300ms, top 5 resultados desde geoIndex
□ Botón "Compartir ubicación" → navigator.share() o copia portapapeles
□ Link universal: https://www.google.com/maps?q=lat,lng
□ Descarga mapa desde StoragePanel (NO desde boot):
    □ Progreso visible (barra + %)
    □ Cancelable en curso
    □ Checksum validado contra /maps/cuba.pmtiles.sha256
    □ Metadata guardada en syncMeta post-descarga
□ map_tiles phase en boot solo verifica (no descarga)
□ SW precache de /maps/style.json, fonts, sprites
□ Backend endpoints para persistir marcadores/anotaciones de mapa
□ mapMarkers / mapAnnotations stores en IDB con sync Tipo A
□ /maps/cuba.pmtiles.meta.json existe con version, sha256, sizeBytes, updatedAt
□ map_tiles verifica version contra server: si serverChecksum !== clientChecksum → banner "Nueva versión disponible"
□ Si OPFS tiene cuba.pmtiles pero no metadata → marcado como huérfano → re-descargar
□ SHA-256 de archivo completo (~1-3s) no bloquea UI (corre post-ready_partial)
□ Tabla de responsabilidades: Next.js sirve /maps/, Spring Boot sirve imágenes
□ ImageResolver resuelve /api/v1/.../images/... desde OPFS offline
□ useImageUrl hook revoca ObjectURLs correctamente en cleanup
□ OfflineImage usa ImageResolver internamente + placeholder cuando no hay cache
□ Escrituras offline con imágenes: outbox incluye referencia a OPFS blob
□ nameLower se normaliza en CustomerRepository.create()/update()
□ isMapDownloading flag en schedulerState evita descarga concurrente
□ isMapDownloading verificado antes de descarga automática de primer arranque
□ Axios interceptor: no intentar refresh si getNetworkMode() === 'offline'
□ BroadcastChannel token-refresh para sincronización cross-tab de tokens
□ imageCache → imageIndex: migración gradual (deprecación, cleanup on prune)
□ Repos local-first: todos los repos leen de IDB, no de HTTP primario (rg "apiClient.get" en repos/ solo retorna auth/user/audit)
□ currencies, exchangeRates, customerDebts descargados en loader phases correspondientes
□ precache_routes usa credentials: 'omit' — no cachea HTML con datos de usuario
□ appLogger no escribe a IDB antes de setIdbReady(true) — buffer en memoria antes de db_open
□ navigator.locks.request('download-lock-{entity}') en DownloadQueueService para multi-tab
□ navigator.getBattery() envuelto en feature detection (try-catch, fallback si no existe)
□ Tipo B: sales CONFIRMED / transfers COMPLETED / adjustments FINAL requieren confirmación remota
□ Tipo B procesados ANTES que Tipo A en outbox (priority: 'critical')
□ Tipo B con estado intermedio visible (PENDING/IN_TRANSIT badge naranja)
□ PushResultDto completo: serverPayload, entityType, entityId, errorCode, versions
□ FieldDiffTable recibe serverPayload + clientPayload y renderiza diff campo a campo
□ PMTiles obtenido de Protomaps/OpenFreeMap, colocado manualmente en directorio externo configurable (NO resources/static/)
□ PMTiles servido con FileSystemResource (NO ClassPathResource) para soportar Range requests
□ Todos los assets de mapa (fonts, sprites, style) se descargan UNA VEZ por admin, nunca fetch de internet
□ SW SET_USER_CONTEXT postMessage: login → notifySwUserContext(id), logout → notifySwUserContext(null)
□ SW limpia caches con userId al recibir SET_USER_CONTEXT null (solo caches dinámicas, no precache estático)
□ Flat array integrity: warehouses/categories/customers/suppliers/stockBalances con X-Content-Checksum en backend + validación en frontend (fetchAllWithIntegrity)
□ navigator.locks fallback: si 'locks' no está en navigator, ejecutar sin lock (Safari < 15.4). No bloquea funcionalidad.
□ geoIndex se carga post-ready_partial (no durante db_open). Fallo no degrada availability.
□ geoIndex reintenta máximo 3 veces en la misma sesión
□ serverPayload null en PushResultDto: manejar NOT_FOUND (objeto eliminado en servidor) + acciones "Conservar local" / "Eliminar local"
□ HealthPanel visible con ?debug=1: métricas IDB, cuota, session, sync, background tasks + botón diagnóstico ejecutable
□ MapController.java sirve /api/v1/maps/{filename} con Accept-Ranges + Cache-Control immutable + Range request soporte automático
□ PMTiles se sirve desde Spring Boot con Range requests (no desde Next.js). MapLibre protocolo pmtiles:// usa HTTP Range.
```

### F.2 — Build checks

```bash
cd frontend && pnpm exec tsc --noEmit && pnpm lint && pnpm build
cd backend/inventory-app && mvn compile -q
```

### F.3 — Pruebas offline

```bash
# 1. Arrancar con internet → esperar carga completa
# 2. Desconectar → refrescar → app carga desde IDB + SW cache
# 3. Navegar a productos, clientes, stock → datos visibles
# 4. Abrir mapa → "Mapa no disponible. Descargar desde Configuración"
# 5. Ir a Settings → StoragePanel → "Descargar mapa"
# 6. Progreso visible mientras descarga (cancelable)
# 7. Una vez descargado: abrir mapa → PMTiles desde OPFS
# 8. Buscar "La Habana" en geocoder → funciona offline
# 9. Compartir ubicación → link generado / compartido
# 10. Cerrar sesión → limpiar cache → abrir sin internet → login (sin datos)
```

### F.4 — Prueba multiusuario conflicto

```bash
# 1. Dos pestañas, mismo producto
# 2. Tab 1: editar + guardar
# 3. Tab 2: editar (versión antigua) + guardar
# 4. Tab 2: conflicto → FieldDiffTable en SyncConflictResolver
# 5. Verificar NUNCA merge silencioso
```

### F.5 — Prueba de corrupción

```bash
# 1. Interceptar response /api/v1/products/paginated → JSON corrupto
# 2. Chunk va a corruptionQueue
# 3. CorruptionRepairCenter: reparar → reintentar commit
```

### Files Summary F

| Archivo | Acción |
|---------|--------|
| (verificación manual) | — |

---

## Fase H — Doc & Code Cleanup: eliminar código/documentación muerta, consolidar documentación

> **Skills**: `clean-code`, `file-organizer`
> **Objetivo**: Eliminar todo el código muerto, documentación obsoleta y referencias a librerías que ya no se usan. Consolidar `docs/` y `docs_dev/` para que reflejen el estado actual del proyecto. Actualizar README. Esta fase se ejecuta al final para que no interfiera con fases anteriores y capture todo el código que quedó huérfano durante la implementación.

### H.1 — Eliminar código muerto del frontend

| Archivo | Razón | Riesgo |
|---------|-------|--------|
| `frontend/src/presentation/shared/components/map/OfflineMap.tsx` | Leaflet — reemplazado por MapLibre. Eliminar solo si MapLibre ha sido validado ≥ 2 semanas en producción sin regresiones | Medio — si MapLibre falla, reactivar este archivo desde git |
| `frontend/src/infrastructure/maps/adapters/CubaTileManager.ts` | Leaflet tile manager — reemplazado por OPFSTileSource | Bajo |
| `frontend/src/infrastructure/maps/adapters/CubaGeoSearchAdapter.ts` | Leaflet geo search — reemplazado por geo-index.ts + useGeoSearch | Bajo |
| `frontend/src/core/loading/types/app-loader-types.ts` (si existe `totalSteps`) | `totalSteps` eliminado del store en A.1 | Bajo — verificar que no haya imports huérfanos |
| `frontend/src/infrastructure/storage/db.ts` store `imageCache` (v4) | Reemplazado por `imageIndex` en v5. El upgrade v5 ya no crea este store | Bajo — datos huérfanos se limpian en pruning automático |
| Dependencias `package.json`: `react-leaflet`, `leaflet.vectorgrid`, `@types/leaflet` | Leaflet reemplazado | Medio — verificar que nadie importe de estos paquetes |

**Verificación post-eliminación**:
```bash
cd frontend && pnpm exec tsc --noEmit && pnpm lint && pnpm build
```

### H.2 — Eliminar/reemplazar console.error remanentes (auditoría final)

Ejecutar búsqueda global:
```bash
rg "console\.(error|warn|log|info|debug)" frontend/src/ --include '*.ts' --include '*.tsx'
```

Reemplazar cualquier remanente por `appLogger`. Los casos ya identificados (A.9) cubren 12 ocurrencias en 5 archivos. Verificar que no hayan aparecido más durante implementación de fases B-G.

### H.3 — Eliminar documentación obsoleta

| Documento | Problema | Acción |
|-----------|----------|--------|
| `docs/design/offline-strategy.md` | Referencia Dexie.js v4+ y Workbox (librerías que ya no se usan) | Reescribir secciones de IndexedDB (usar `idb`) y Service Worker (usar Serwist). Actualizar diagrama de arquitectura |
| `docs/design/implementation-roadmap.md` | Dice "no backend, frontend, OpenAPI ni migrations materialized" — completamente desactualizado | Marcar como `[ARCHIVED]` o reescribir para reflejar estado actual. No borrar — mantener como histórico |
| `docs/adr/architecture-decisions.md` | ADR-003 referencia Dexie.js; faltan ADRs para migraciones de librería | Agregar ADR-009: Dexie.js → `idb`. ADR-010: Workbox → Serwist. ADR-011: Leaflet → MapLibre (post-validación) |
| `docs/contracts/image-handling.md` | Sección offline referencia `ImageCache` store con schema viejo | Actualizar a `imageIndex` + OPFS, referenciar `useImageCache` hook y `ImageResolver` |
| `docs/contracts/database-schema.md` | Línea 373 referencia Dexie.js | Cambiar a "idb v8+" |
| `docs/contracts/dtos.md` | Falta `salePrice` en Product DTOs | Agregar `salePrice?: number` a `ProductCreateRequest`, `ProductUpdateRequest`, `ProductResponse` |
| `docs/plans/2026-05-05-notifications-system-design.md` | Plan supersedido — el sistema de notificaciones implementado es más simple | Agregar header `# SUPERSEDED — ver docs/contracts/notifications-reference.md para implementación actual` al inicio del archivo |
| `frontend/README.md` | Boilerplate genérico de create-next-app | Reescribir con contenido específico del proyecto |
| `docs_dev/task_plan.md` (secciones de cada fase) | Después de implementar cada fase, actualizar su estado de ❌ Pendiente a ✅ Completado | Mantener vivo como historial de ejecución |

### H.4 — Actualizar README.md raíz

El README actual tiene varios problemas:
1. **PostgreSQL version**: 16 → 17
2. **API endpoint table**: URLs desactualizadas (usa PUT/DELETE, la API real usa PATCH)
3. **Duplicación**: "Stack Tecnológico" y "Arquitectura" aparecen dos veces cada uno
4. **Falta mención a offline-first**: La feature principal del proyecto no está documentada
5. **Falta enlace a documentación técnica**: No referencia `docs/contracts/` ni `docs_dev/task_plan.md`

Reestructuración propuesta:

```
# Gestión de Inventario — Offline-First

## Stack Tecnológico (único, sin duplicar)
- Frontend: Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS v4 + shadcn/ui
- Backend: Spring Boot 3.4 + WebFlux + Java 21
- DB: PostgreSQL 17 + R2DBC + Flyway
- Offline: IndexedDB (idb) + OPFS + Serwist SW + TanStack Query + Zustand
- Maps: MapLibre GL JS + PMTiles (OPFS)
- Proxy: Caddy 2 (HTTPS local autofirmado)

## Arquitectura (única, sin duplicar)
- Backend hexagonal: domain → application → adapters
- Frontend hexagonal: core → infrastructure → presentation
- Offline-first: IDB como fuente de verdad para UI, sync service bidireccional

## APIs principales (tabla reducida, referenciar docs/contracts/endpoints.md)
| Recurso | Endpoint | Métodos |
|---------|----------|---------|
| Productos | /api/v1/products | GET, POST |
| Productos paginados | /api/v1/products/paginated | GET |
| Producto por ID | /api/v1/products/{id} | GET, PATCH |
| ... | (referenciar docs/contracts/endpoints.md para lista completa) | ... |

## Desarrollo local → (enlace a start-dev.sh)

## Documentación
- `docs/contracts/` — Endpoints, DTOs, DB schema, ports
- `docs/design/` — Estrategia offline, UX, glosario
- `docs/adr/` — Decisiones arquitectónicas
- `docs_dev/task_plan.md` — Plan de implementación activo
```

### H.5 — Consolidar `docs_dev/` → `docs/` (opcional)

Los archivos en `docs_dev/` son más actuales que sus equivalentes en `docs/`:

| docs_dev/ | Equivalente en docs/ | Acción |
|-----------|---------------------|--------|
| `docs_dev/database-schema.md` | `docs/contracts/database-schema.md` | Reemplazar contenido de docs/ con la versión de docs_dev/ |
| `docs_dev/offline-first-plan.md` | `docs/design/offline-strategy.md` | Reemplazar contenido de docs/ con la versión de docs_dev/ |
| `docs_dev/task_plan.md` | `docs/plans/implementation-plan.md` | Mantener ambos: task_plan.md es el plan activo, implementation-plan.md es histórico de lo ya implementado |

**Decisión**: NO eliminar `docs_dev/` — mantener como espacio de trabajo para documentación en desarrollo. Pero actualizar los equivalentes en `docs/` para que reflejen la información más reciente.

### H.6 — Archivos huérfanos detectados durante implementación

Al finalizar fases A-G, ejecutar:
```bash
# Buscar imports que apunten a archivos eliminados
cd frontend && pnpm exec tsc --noEmit 2>&1 | grep "Cannot find module"
# Buscar referencias a stores IDB que ya no existen
rg "imageCache" frontend/src/ --include '*.ts' --include '*.tsx'
# Buscar imports de Leaflet
rg "react-leaflet|leaflet" frontend/src/ --include '*.ts' --include '*.tsx'
```

Cualquier archivo que solo sea importado por código muerto (que se elimina en H.1) debe eliminarse también.

### Files Summary H

| Archivo | Acción |
|---------|--------|
| `frontend/.../OfflineMap.tsx` | Eliminar (post-validación MapLibre ≥ 2 semanas) |
| `frontend/.../CubaTileManager.ts` | Eliminar |
| `frontend/.../CubaGeoSearchAdapter.ts` | Eliminar |
| `frontend/package.json` | Eliminar dependencias: react-leaflet, leaflet.vectorgrid, @types/leaflet |
| `README.md` | Reescribir: PostgreSQL 17, endpoints actualizados, sin duplicados, +offline-first +referencia docs |
| `frontend/README.md` | Reescribir con contenido específico del proyecto |
| `docs/design/offline-strategy.md` | Actualizar: Dexie.js→idb, Workbox→Serwist, stores actualizados |
| `docs/design/implementation-roadmap.md` | Marcar como `[ARCHIVED]` |
| `docs/adr/architecture-decisions.md` | +ADR-009 (idb), ADR-010 (Serwist), ADR-011 (MapLibre) |
| `docs/contracts/image-handling.md` | Actualizar sección offline: imageIndex + OPFS |
| `docs/contracts/database-schema.md` | Dexie.js→idb v8+ |
| `docs/contracts/dtos.md` | +salePrice a Product DTOs |
| `docs/plans/2026-05-05-notifications-system-design.md` | Marcar como SUPERSEDED |
| `docs_dev/task_plan.md` | Actualizar estados de fase a ✅ Completado según implementación |

**Verificación:**
```bash
cd frontend && pnpm exec tsc --noEmit && pnpm lint && pnpm build
cd backend/inventory-app && mvn compile -q
```

---

## Fase I — Mantenimiento Local: MaintenanceService + pruning automático + alarmas cuota

> **Skills**: `senior-frontend`, `clean-code`, `hexagonal-architecture`
> **Objetivo**: Implementar el servicio de mantenimiento local que ejecuta pruning automático programado, evicción LRU de imágenes, cleanup de logs, y alarmas de cuota de almacenamiento. Sin este servicio, los datos acumularían indefinidamente violando budgets y llenando la cuota.
> **Por qué aquí**: El plan describe una política detallada de retención y pruning pero no incluye una fase ni tarea para implementar `MaintenanceService`. Esta fase cierra ese gap.

### I.1 — `MaintenanceService.ts`: scheduler de pruning automático

**Archivo**: `frontend/src/infrastructure/storage/MaintenanceService.ts`

Servicio que ejecuta tareas de mantenimiento en estos triggers:

| Trigger | Cuándo | Operaciones que ejecuta |
|---------|--------|------------------------|
| **Boot** (`rehydrate_local`) | Al iniciar app | Cleanup downloadChunks huérfanos, purge appLogs TTL, cleanup OPFS temporales, verificar cuota |
| **Post-sync exitoso** | Después de `processOutbox()` + `pullCatalogsIfStale()` | Date pruning (sales, movements, etc.), purge notifications, cleanup downloadChunks committed |
| **Temporizado** | Cada 30 min si app activa | Date pruning completo, LRU eviction imageIndex, verificar cuota |
| **Presión de cuota** | `storage.estimate()` < 20% | LRU eviction agresiva, purge logs + notifications, banner al usuario |

```typescript
import { openDB, type IDBPDatabase } from 'idb';
import { appLogger } from '@/infrastructure/logging/appLogger';

const PRUNE_INTERVAL_MS = 30 * 60 * 1000; // 30 minutos
const QUOTA_WARN_THRESHOLD = 0.2; // 20%
const QUOTA_CRITICAL_THRESHOLD = 0.1; // 10%

export class MaintenanceService {
  private timerId: ReturnType<typeof setInterval> | null = null;
  private running = false;

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    await this.runAll();
    this.timerId = setInterval(() => this.runAll(), PRUNE_INTERVAL_MS);
    appLogger.info('[Maintenance] Service started');
  }

  stop(): void {
    if (this.timerId) clearInterval(this.timerId);
    this.running = false;
  }

  async runAll(): Promise<void> {
    // Verificar schedulerState.isPruning para evitar concurrencia
    const { isPruning } = useSchedulerState.getState();
    if (isPruning) return;
    useSchedulerState.getState().setPruning(true);
    try {
      await this.checkQuota();
      await this.purgeAppLogs();
      await this.purgeNotifications();
      await this.runDatePruning();
      await this.cleanupDownloadChunks();
      await this.cleanupTempFiles();
      await this.evictImageCacheIfNeeded();
    } catch (err) {
      appLogger.error('[Maintenance] Error during maintenance cycle', err);
    } finally {
      useSchedulerState.getState().setPruning(false);
    }
  }

  private async checkQuota(): Promise<void> {
    // Verificar storage.estimate() y mostrar banners si < umbral
  }

  // ... métodos de pruning (ver sección Política de Mantenimiento para implementación)
}
```

### I.2 — runDatePruning: pruning rolling por fecha

Implementar la función `runDatePruning` ya definida en la sección "Guard de formato antes de pruning por fecha" (líneas 668-710). Aplicar a todos los stores con rolling TTL:

| Store | Índice IDB | Cutoff | Estrategia de comparación |
|-------|-----------|--------|--------------------------|
| `sales` | `by-sale-date` | 90 días | ISO8601 string o timestamp numérico |
| `movements` | `by-occurred-at` | 90 días | ISO8601 string o timestamp numérico |
| `purchases` | `by-occurred-at` | 180 días | ISO8601 string o timestamp numérico |
| `transfers` | `by-occurred-at` | 90 días | ISO8601 string o timestamp numérico |
| `adjustments` | `by-occurred-at` | 90 días | ISO8601 string o timestamp numérico |
| `returns` | `by-occurred-at` | 90 días | ISO8601 string o timestamp numérico |
| `notifications` | — | 30 días | `createdAt` timestamp numérico |
| `appLogs` | `by-timestamp` | 7 días | `timestamp` numérico + max 5000 |

> ⚠️ Verificar formato de fechas (A.12) antes de implementar pruning. El guard de validación en `runDatePruning` evita pruning incorrecto si el formato no es ISO8601 string.

### I.3 — LRU eviction de imageIndex

```typescript
async function evictImageCacheLRU(maxBytes: number = 100 * 1024 * 1024): Promise<number> {
  const db = await openDB('inventory-offline', 5);
  const all = await db.getAllFromIndex('imageIndex', 'by-last-access'); // ASC por lastAccessedAt
  let total = all.reduce((sum, e) => sum + e.sizeBytes, 0);
  if (total <= maxBytes) return 0;

  let evicted = 0;
  let freed = 0;
  for (const entry of all) {
    if (total - freed <= maxBytes) break;
    await deleteOPFSFile(entry.opfsPath).catch(() => {});
    await db.delete('imageIndex', entry.key);
    freed += entry.sizeBytes;
    evicted++;
  }
  appLogger.info(`[Maintenance] LRU evicted ${evicted} entries, freed ${(freed / 1024 / 1024).toFixed(1)}MB`);
  return evicted;
}
```

### I.4 — Cleanup de OPFS temporales

```typescript
async function cleanupTempFiles(): Promise<void> {
  const root = await navigator.storage.getDirectory();
  const entries: string[] = [];
  for await (const [name] of (root as any).entries()) {
    if (name.endsWith('.tmp') || name.startsWith('__')) entries.push(name);
  }
  await Promise.allSettled(entries.map(name => root.removeEntry(name).catch(() => {})));
  if (entries.length > 0) appLogger.info(`[Maintenance] Cleaned ${entries.length} temp files from OPFS`);
}
```

### I.5 — Cleanup de downloadChunks committed

```typescript
async function cleanupOldChunks(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
  const db = await openDB('inventory-offline', 5);
  const cutoff = Date.now() - maxAge;
  const index = db.transaction('downloadChunks').store.index('by-status');
  let cursor = await index.openCursor(IDBKeyRange.only('committed'));
  let deleted = 0;
  while (cursor) {
    if ((cursor.value.committedAt ?? 0) < cutoff) {
      await cursor.delete();
      deleted++;
    }
    cursor = await cursor.continue();
  }
  if (deleted > 0) appLogger.info(`[Maintenance] Purged ${deleted} old downloadChunks`);
}
```

### I.6 — Hook `useMaintenance.ts`: dispara MaintenanceService

**Archivo**: `frontend/src/presentation/shared/hooks/storage/useMaintenance.ts`

Hook que inicia el `MaintenanceService` cuando la app alcanza `ready_partial`:

```typescript
export function useMaintenance(): void {
  const availability = useAppLoaderStore(s => s.availability);
  const maintenanceRef = useRef<MaintenanceService | null>(null);

  useEffect(() => {
    if (availability !== 'ready_partial' && availability !== 'ready_complete') return;
    if (maintenanceRef.current) return;

    const service = new MaintenanceService();
    service.start();
    maintenanceRef.current = service;

    return () => {
      service.stop();
      maintenanceRef.current = null;
    };
  }, [availability]);
}
```

### I.7 — Quota alerts UI

En el hook que escucha `storage.estimate()`, agregar alertas de cuota:

```typescript
// En useMaintenance.ts o hook separado useQuotaAlert.ts:
useEffect(() => {
  const check = async () => {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return;
    const { usage, quota } = await navigator.storage.estimate();
    if (!quota || !usage) return;
    const pct = usage / quota;
    if (pct > 0.9) {
      // Banner persistente rojo: "Almacenamiento casi lleno (90%)"
      showQuotaBanner('critical', `Almacenamiento casi lleno (${Math.round(pct * 100)}%). Libera espacio en Configuración.`);
    } else if (pct > 0.8) {
      // Banner amarillo: "Almacenamiento al ${Math.round(pct * 100)}%"
      showQuotaBanner('warning', `Almacenamiento al ${Math.round(pct * 100)}%. Considera limpiar datos antiguos.`);
    }
  };
  check();
  const interval = setInterval(check, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

### I.8 — Files Summary I

| Archivo | Acción |
|---------|--------|
| `frontend/src/infrastructure/storage/MaintenanceService.ts` | Nuevo — scheduler pruning + evicción LRU + cleanup |
| `frontend/src/presentation/shared/hooks/storage/useMaintenance.ts` | Nuevo — hook que inicia MaintenanceService post-ready_partial |
| `frontend/src/infrastructure/sync/SyncService.ts` | Modificado — +call a service.runAll() post-sync exitoso |
| `frontend/src/presentation/shared/hooks/storage/useAppLoader.ts` | Modificado — +call a MaintenanceService.runAll() en rehydrate_local |

**Verificación:**
```bash
cd frontend && pnpm exec tsc --noEmit && pnpm lint
```

---

### Nuevos archivos (31)

| Archivo | Fase | Propósito |
|---------|------|-----------|
| `src/core/loading/types/corruption.ts` | A | Schema CorruptionEntry |
| `src/core/loading/types/download-chunk.ts` | A | Schema DownloadChunk (+ userId) |
| `src/infrastructure/logging/appLogger.ts` | A | Logger wrapper + buffer+flush+truncado |
| `src/presentation/shared/components/debug/AppLogViewer.tsx` | A | Log viewer (dev only) |
| `src/infrastructure/storage/DownloadQueueService.ts` | B | Cola controlada + SHA-256 + quarantine |
| `src/core/loading/validators/index.ts` | B | Validación semántica DTOs (basada en DTOs reales) |
| `src/presentation/shared/components/data-repair/CorruptionRepairCenter.tsx` | B | UI reparación datos corruptos |
| `src/infrastructure/maps/MapLibreInitializer.ts` | E | Registro protocolo pmtiles:// (lazy) |
| `src/infrastructure/maps/protocols/OPFSTileSource.ts` | E | Protocolo opfs-pmtiles:// → OPFS → MapLibre |
| `src/infrastructure/maps/styles/cuba-map-style.ts` | E | Estilo JSON offline con layers vectoriales |
| `src/presentation/shared/components/map/MapPreview.tsx` | E | Mapa embebido static/expandible |
| `src/presentation/shared/components/map/MapViewer.tsx` | E | Mapa interactivo view/select + compartir |
| `src/presentation/shared/components/map/MapStatusOverlay.tsx` | E | Overlay estados (no disponible, descargando, error) |
| `src/presentation/shared/hooks/map/useGeoSearch.ts` | E | Búsqueda offline geoIndex (debounce 300ms, top 5) |
| `src/presentation/shared/components/storage/StoragePanel.tsx` | Política mantenimiento | Panel almacenamiento + descarga mapa (progreso, cancelar) |
| `src/presentation/shared/components/storage/HealthPanel.tsx` | Política mantenimiento | Panel de salud operacional |
| `src/infrastructure/maps/data/geo-index.ts` | E | Gazetteer offline (acotado MVP) |
| `src/presentation/shared/hooks/device/useGeolocation.ts` | E | GPS offline hook |
| `docs_dev/adr-map-migration.md` | E | ADR Leaflet→MapLibre + criterio retiro |
| `frontend/public/maps/style.json` | E | Estilo MapLibre Cuba |
| `frontend/public/maps/cuba.pmtiles.sha256` | E | Hash SHA-256 para validación |
| `frontend/public/maps/fonts/NotoSansRegular/0-255.pbf` | E | Fuente etiquetas offline |
| `frontend/public/maps/fonts/NotoSansBold/0-255.pbf` | E | Fuente bold etiquetas |
| `frontend/public/maps/sprites/sprite.json` + `sprite.png` | E | Sprites iconos offline |
| `src/infrastructure/images/useImageCache.ts` | G | Hook cache imágenes OPFS + objectURL |
| `src/infrastructure/images/ImageResolver.ts` | G | Resuelve /api/v1/images/... desde OPFS |
| `src/presentation/shared/hooks/images/useImageUrl.ts` | G | Hook sobre ImageResolver con auto-revoke |
| `src/presentation/shared/components/media/OfflineImage.tsx` | G | Componente imagen offline (loading/error/success) |
| `src/presentation/shared/components/media/ImageGallery.tsx` | G | Galería imágenes con lightbox modal |
| Backend `ImageController.java` | G | Endpoint /api/v1/images/** con ETag + streaming |
| Backend `MapController.java` | E | Endpoint /api/v1/maps/{filename} con Accept-Ranges + Cache-Control immutable |
| Backend `WarehouseController.java` | B | +X-Content-Checksum header en GET /api/v1/warehouses |
| Backend `CategoryController.java` | B | +X-Content-Checksum header en GET /api/v1/categories |
| Backend `CustomerController.java` | B | +X-Content-Checksum header en GET /api/v1/customers |
| Backend `SupplierController.java` | B | +X-Content-Checksum header en GET /api/v1/suppliers |
| Backend `StockController.java` | B | +X-Content-Checksum header en GET /api/v1/stock-balances |

### Archivos eliminados (3) — Fase H

| Archivo | Razón |
|---------|-------|
| `frontend/.../OfflineMap.tsx` | Leaflet — reemplazado por MapLibre (post-validación ≥ 2 sem) |
| `frontend/.../CubaTileManager.ts` | Leaflet tile manager — reemplazado por OPFSTileSource |
| `frontend/.../CubaGeoSearchAdapter.ts` | Leaflet geo search — reemplazado por geo-index.ts |

### Archivos modificados (50)

| Archivo | Fases | Cambio |
|---------|-------|--------|
| `src/core/loading/appLoaderStore.ts` | A, C | Phase/availability split; `rehydrate_local`; eliminar `totalSteps`; `map_tiles`, `precache_routes`, `degraded`; +flag `isMapDownloading` |
| `src/infrastructure/storage/db.ts` | A | v4→v5: imageIndex (reemplaza imageCache), by-sale-date, by-occurred-at, corruptionQueue, downloadChunks, appLogs, geoIndex (schema) + 4 console.error → appLogger |
| `src/presentation/shared/hooks/storage/useAppLoader.ts` | A, B, C | Fix endpoint + DownloadQueueService + rehydrate_local + image_prefetch effect + effects map_tiles (solo verificación) /precache_routes + appLogger |
| `src/presentation/shared/components/network-status/CacheProgressBar.tsx` | C | Adaptado a phase/availability; ready_partial vs ready_complete vs degraded |
| `src/presentation/modules/sync/components/SyncConflictResolver.tsx` | D | FieldDiffTable con diff campo a campo |
| `src/presentation/shared/hooks/storage/useAuthStore.ts` | A | 5 console.error → appLogger.error; +SET_USER_CONTEXT postMessage al SW en login/logout; +listener SW_UPDATED con chequeo outbox pendiente |
| `src/presentation/shared/hooks/storage/useSyncStatus.ts` | A | 1 console.error → appLogger.error |
| `src/presentation/shared/components/data-display/NotificationPanel.tsx` | A | 1 console.error → appLogger.error |
| `src/presentation/shared/components/feedback/PreferencesPanel.tsx` | A | 1 console.error → appLogger.error |
| `src/presentation/shared/components/storage/HealthPanel.tsx` | C | Nuevo — panel diagnóstico con métricas IDB, cuota, session, auditoría |
| Backend controllers (warehouses, categories, customers, suppliers, stock) | B | +X-Content-Checksum header para integridad de transporte en arrays planos |
| `src/presentation/shared/components/map/MapControls.tsx` | E | Usar `useGeolocation` + flyTo |
| `frontend/next.config.ts` | E | Headers Accept-Ranges para /maps/ |
| `frontend/package.json` | E, G | +maplibre-gl, @maplibre/maplibre-gl-geocoder |
| Backend `ProductController.java` | B | +chunkChecksum a PaginatedProductResponse |
| Backend `PushResultDto.java` | D | +serverPayload, entityType, entityId, errorCode, serverVersion, clientVersion |
| Backend `ImageService.java` | G | Verificar/generar thumbnails (Thumbnailator, quality 0.95, 200x200) |
| Backend `pom.xml` | G | +thumbnailator dependencia |
| `frontend/src/infrastructure/sync/SyncService.ts` | D | Outbox con prioridad Tipo B > Tipo A |
| Backend `/api/v1/geo/provinces` + `/api/v1/geo/municipalities/{id}` | A | Endpoints existentes — reemplazan bundle estático para geoIndex. El frontend `GeoRegionRepository` ya los consume. |
| `frontend/src/app/serwist/[path]/route.ts` | E | +precache assets mapa (fonts, sprites, style, shell) |
| `frontend/src/infrastructure/repositories/product/ProductRepository.ts` | A | Migrar de `readWithCache(HTTP, IDB)` a `local-first` (lectura siempre desde IDB) |
| `frontend/src/infrastructure/repositories/category/CategoryRepository.ts` | A | Ídem |
| `frontend/src/infrastructure/repositories/warehouse/WarehouseRepository.ts` | A | Ídem |
| `frontend/src/infrastructure/repositories/customer/CustomerRepository.ts` | A | Ídem |
| `frontend/src/infrastructure/repositories/supplier/SupplierRepository.ts` | A | Ídem |
| `frontend/src/infrastructure/repositories/currency/CurrencyRepository.ts` | A | Ídem |
| `frontend/src/infrastructure/repositories/exchange-rate/ExchangeRateRepository.ts` | A | Ídem |
| `frontend/src/infrastructure/repositories/sale/SaleRepository.ts` | A | Ídem |
| `frontend/src/infrastructure/repositories/purchase/PurchaseRepository.ts` | A | Ídem |
| `frontend/src/infrastructure/repositories/transfer/TransferRepository.ts` | A | Ídem |
| `frontend/src/infrastructure/repositories/adjustment/AdjustmentRepository.ts` | A | Ídem |
| `frontend/src/infrastructure/repositories/return/ReturnRepository.ts` | A | Ídem |
| `frontend/src/infrastructure/repositories/movement/MovementRepository.ts` | A | Ídem |
| `frontend/src/infrastructure/repositories/stock/StockRepository.ts` | A | Ídem |
| `frontend/src/infrastructure/repositories/customer/CustomerDebtRepository.ts` | A | Agregar `db.getCachedCustomerDebts()` como fuente local (hoy HTTP directo) |
| `frontend/src/infrastructure/repositories/dashboard/DashboardRepository.ts` | A | Compute desde IDB local en vez de HTTP |
| `frontend/src/infrastructure/repositories/dashboard/DashboardMetricsRepository.ts` | A | Compute desde IDB local en vez de HTTP |
| `frontend/src/infrastructure/logging/appLogger.ts` | A | +guard `idbReady` para evitar flush prematuro a IDB |
| `README.md` | H | Reescribir: PostgreSQL 17, endpoints actualizados, sin duplicados, +offline-first +docs reference |
| `frontend/README.md` | H | Reescribir con contenido específico del proyecto (no boilerplate) |
| `docs/design/offline-strategy.md` | H | Actualizar: Dexie.js→idb, Workbox→Serwist, stores actualizados |
| `docs/design/implementation-roadmap.md` | H | Marcar como [ARCHIVED] |
| `docs/adr/architecture-decisions.md` | H | +ADR-009 (Dexie.js→idb), ADR-010 (Workbox→Serwist), ADR-011 (Leaflet→MapLibre) |
| `docs/contracts/image-handling.md` | H | Actualizar sección offline: imageIndex + OPFS + ImageResolver |
| `docs/contracts/database-schema.md` | H | Referencia Dexie.js → idb v8+ |
| `docs/contracts/dtos.md` | H | +salePrice a Product DTOs |
| `docs/plans/2026-05-05-notifications-system-design.md` | H | Marcar como SUPERSEDED con header |
| `frontend/package.json` | E, G, H | +maplibre-gl, @maplibre/maplibre-gl-geocoder; −react-leaflet, leaflet.vectorgrid, @types/leaflet |
| Backend `application.yml` | D | Access token TTL: 30 días → 15 minutos |
| Backend `SecurityConfig.java` (opcional) | D | Si el TTL está hardcodeado en Java, cambiarlo aquí |
| `frontend/src/app/serwist/[path]/route.ts` (o registro SW) | A | +listener SW_UPDATED + chequeo outbox pendiente antes de activar; +handler SKIP_WAITING; +activate cleanup de caches viejas |

### Archivos heredados (1 — sin cambios, relevancia contextual)

| Archivo | Propósito |
|---------|-----------|
| `frontend/src/presentation/modules/sync/components/DeadLetterList.tsx` | Ya existente, sin cambios |

> Los archivos Leaflet (`OfflineMap.tsx`, `CubaTileManager.ts`, `CubaGeoSearchAdapter.ts`) se eliminan en Fase H.1 — ya no son heredados.

**Total**: 34 nuevos + 53 modificados + 3 eliminados + 1 heredado = 91 archivos.
- **Nuevos**: 31 originales + `MaintenanceService.ts` + `useMaintenance.ts` + `backgroundTasksStore.ts` = 34
- **Modificados**: 50 originales + `application.yml` (app.maps.location) + `syncService.ts` (lock + maintenance call) + `useAppLoader.ts` (maintenance call) = 53

---

## Documentación Arquitectónica Añadida

| Documento | Fase | Propósito |
|-----------|------|-----------|
| `docs_dev/adr-map-migration.md` | E | Decisión de migrar Leaflet→MapLibre + criterio de retiro |
| (inline en task_plan.md) | — | Principios, matriz de entidad, política de conflictos, política de cache/sesión, budgets, backpressure |
