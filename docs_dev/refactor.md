# Plan: Fase R — Service Worker Caching Real (offline SW)

> Created: 2026-06-15 | v4 — Ambiguidades resueltas con codebase audit. Estrategias confirmadas contra código real.
> Extiende `task_plan.md`: reglas, principios P1–P5 y convenciones aplican. Fase R.

---

## 0. Contexto y Causa Raíz

### Síntoma

```
serwist Using NetworkOnly to respond to 'http://localhost:8080/api/v1/customers'
serwist Using NetworkOnly to respond to '/_next/static/chunks/src_0qqa97n._.js'
serwist Network request for '/dashboard' threw an error. TypeError: Failed to fetch
```

**Todo se sirve con `NetworkOnly`**. Marcar "Offline" en DevTools → la app no carga.

### Causa Raíz

`node_modules/@serwist/turbopack/dist/index.worker.mjs:14-17`:

```javascript
const defaultCache = process.env.NODE_ENV !== "production" ? [{
    matcher: /.*/i,
    handler: new NetworkOnly()
}] : [ /* producción: estrategias reales */ ];
```

En desarrollo serwist usa catch-all `NetworkOnly` deliberadamente, pero **impide probar offline localmente**.

### Problemas Adicionales

1. **`additionalPrecacheEntries` con `revision: crypto.randomUUID()`** — revision distinta en cada build
2. **Imagen producto 400 Bad Request** — `useBackgroundTasks.ts:174` genera `/api/v1/images/${encodeURIComponent(key)}` donde `key` ya contiene `%2F`
3. **Sin offline fallback page** — `/~offline` referenciada en SW y en `useBackgroundTasks.ts:118` pero 404
4. **Sin activación inmediata del SW** — `skipWaiting: false`
5. **Sin versionado de caches** — nombres fijos, deploys mezclan assets
6. **Sin network timeout en NetworkFirst** — offline "tildado" 30-60s
7. **Detección incorrecta de navegaciones HTML** — usa `Content-Type`
8. **Sin logout cleanup de caches runtime** — solo se limpian caches legacy `inventory-*`
9. **Sin Background Sync** — mutaciones offline no se reenvían al reconectar

### Alineación con `task_plan.md`

| Principio | Afectado | Por qué |
|-----------|----------|---------|
| **P1. Cero internet** | Sí | Sin SW cache, assets no se sirven si proxy está caído |
| **P2. Dispositivo ligero** | No | — |
| **P3. Offline indefinido** | Sí | Shell offline no persiste sin SW cache |
| **P4. Servidor apagable** | Sí | SW no sirve assets cacheados si backend/proxy cae |
| **P5. Sync no destructivo** | Sí | Sin Background Sync, outbox no se drena automáticamente |

**No contradice `task_plan.md`**:
- API general → `NetworkOnly` (datos desde IDB, respetando "Respuestas API autenticadas — se sirven desde IDB")
- Assets estáticos + shell → cacheados en SW ("Cacheables permanentes")
- Caches por userId ("Namespace de cache SW por userId")
- Logout cleanup de caches ("E. Política de invalidación de SW al logout")
- Mantenimiento periódico de caches ("Cleanup de caches SW viejas", Objetivo 4)

---

## 1. Fases de Implementación

### ✅ Fase R.1 — Custom `runtimeCaching` con estrategias reales (COMPLETED)

> **Commit**: `6d7726c` — feat(sw): custom runtimeCaching with real strategies

**Skills**: `clean-code`, `senior-frontend`

**Archivo**: `frontend/src/app/sw.ts`

Reemplazar `runtimeCaching: defaultCache` con array explícito.

| Decisión | Por qué |
|----------|---------|
| `networkTimeoutSeconds: 3` en NetworkFirst | Sin esto, offline espera 30-60s |
| `request.mode === "navigate"` para HTML | `Content-Type` no existe en request |
| `CacheFirst` para `/_next/static/*` en dev y prod | Hash-versionado, seguro. TTL 1h |
| Prefijo `cache-R1-{name}` | Permite cleanup de caches viejas en activate |
| API general `NetworkOnly` | Datos autenticados desde IDB (task_plan.md) |
| API `/api/v1/images/` + `/media/` con `NetworkFirst` | Imágenes públicas necesarias offline |
| `maxEntries: 256` para next-js | Dev con HMR genera muchos chunks |

```typescript
import {
  CacheFirst, ExpirationPlugin, NetworkFirst, NetworkOnly, StaleWhileRevalidate
} from "serwist";

const CACHE_VERSION = "R1";
const CACHE = (name: string) => `cache-${CACHE_VERSION}-${name}`;
const ONE_HOUR = 60 * 60;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_WEEK = 7 * ONE_DAY;
const THIRTY_DAYS = 30 * ONE_DAY;

const runtimeCaching = [
  // Google Fonts
  { matcher: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i, handler: new CacheFirst({ cacheName: CACHE("gf-webfonts"), plugins: [new ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 365 * ONE_DAY })] }) },
  { matcher: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i, handler: new StaleWhileRevalidate({ cacheName: CACHE("gf-stylesheets"), plugins: [new ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: ONE_WEEK })] }) },

  // Font assets locales
  { matcher: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i, handler: new CacheFirst({ cacheName: CACHE("fonts"), plugins: [new ExpirationPlugin({ maxEntries: 8, maxAgeSeconds: THIRTY_DAYS })] }) },

  // Imágenes estáticas del shell (favicon, iconos SVG)
  { matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i, handler: new StaleWhileRevalidate({ cacheName: CACHE("images"), plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: THIRTY_DAYS })] }) },

  // Next.js static JS (CacheFirst seguro, hash-versionado)
  { matcher: /\/_next\/static.+\.js$/i, handler: new CacheFirst({ cacheName: CACHE("next-js"), plugins: [new ExpirationPlugin({ maxEntries: 256, maxAgeSeconds: ONE_DAY })] }) },

  // Next.js static CSS (CacheFirst)
  { matcher: /\/_next\/static.+\.css$/i, handler: new CacheFirst({ cacheName: CACHE("next-css"), plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: ONE_DAY })] }) },

  // JS genérico
  { matcher: /\.(?:js)$/i, handler: new StaleWhileRevalidate({ cacheName: CACHE("js"), plugins: [new ExpirationPlugin({ maxEntries: 48, maxAgeSeconds: ONE_DAY })] }) },

  // CSS genérico
  { matcher: /\.(?:css|less)$/i, handler: new StaleWhileRevalidate({ cacheName: CACHE("css"), plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: ONE_DAY })] }) },

  // Audio/video
  { matcher: /\.(?:mp3|wav|ogg)$/i, handler: new CacheFirst({ cacheName: CACHE("audio"), plugins: [new ExpirationPlugin({ maxEntries: 8, maxAgeSeconds: ONE_DAY })] }) },

  // RSC data (NetworkFirst con timeout 3s)
  { matcher: /\/_next\/data\/.+\/.+\.json$/i, handler: new NetworkFirst({ cacheName: CACHE("next-data"), networkTimeoutSeconds: 3, plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: ONE_DAY })] }) },

  // JSON/XML data
  { matcher: /\.(?:json|xml|csv)$/i, handler: new NetworkFirst({ cacheName: CACHE("data"), networkTimeoutSeconds: 3, plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: ONE_DAY })] }) },

  // API auth (NetworkOnly — no cachear tokens)
  { matcher: /\/api\/auth\/.*/, handler: new NetworkOnly({ networkTimeoutSeconds: 10 }) },

  // API media/images (NetworkFirst — necesarias offline)
  { matcher: ({ sameOrigin, url: { pathname } }) => sameOrigin && (pathname.startsWith("/api/v1/images") || pathname.startsWith("/media/")), method: "GET", handler: new NetworkFirst({ cacheName: CACHE("media-images"), networkTimeoutSeconds: 3, plugins: [new ExpirationPlugin({ maxEntries: 256, maxAgeSeconds: ONE_WEEK })] }) },

  // API general (NetworkOnly — datos desde IDB, task_plan.md)
  { matcher: ({ sameOrigin, url: { pathname } }) => sameOrigin && pathname.startsWith("/api/"), method: "GET", handler: new NetworkOnly() },

  // RSC prefetch (NetworkFirst)
  { matcher: ({ request, url: { pathname }, sameOrigin }) => request.headers.get("RSC") === "1" && request.headers.get("Next-Router-Prefetch") === "1" && sameOrigin && !pathname.startsWith("/api/"), handler: new NetworkFirst({ cacheName: CACHE("rsc-prefetch"), networkTimeoutSeconds: 3, plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: ONE_DAY })] }) },

  // RSC navigation (NetworkFirst)
  { matcher: ({ request, url: { pathname }, sameOrigin }) => request.headers.get("RSC") === "1" && sameOrigin && !pathname.startsWith("/api/"), handler: new NetworkFirst({ cacheName: CACHE("rsc"), networkTimeoutSeconds: 3, plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: ONE_DAY })] }) },

  // HTML navigation (NetworkFirst — detectar por request.mode)
  { matcher: ({ request, url: { pathname }, sameOrigin }) => request.mode === "navigate" && sameOrigin && !pathname.startsWith("/api/"), handler: new NetworkFirst({ cacheName: CACHE("pages"), networkTimeoutSeconds: 3, plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: ONE_DAY })] }) },

  // Offline page (CacheFirst)
  { matcher: ({ url: { pathname } }) => pathname === "/~offline", handler: new CacheFirst({ cacheName: CACHE("offline") }) },

  // Catch-all same-origin (NetworkFirst)
  { matcher: ({ url: { pathname }, sameOrigin }) => sameOrigin && !pathname.startsWith("/api/"), handler: new NetworkFirst({ cacheName: CACHE("others"), networkTimeoutSeconds: 3, plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: ONE_DAY })] }) },
];
```

**🔄 Orden importa**: Las reglas más específicas van primero. Serwist evalúa en orden. API auth debe ir antes que API general `/api/`, y media/images antes que API general.

**Verificación**: `pnpm exec tsc --noEmit` + `pnpm lint`

---

### Fase R.2 — Activación inmediata + cleanup de caches viejas + clients.claim

**Skills**: `clean-code`, `senior-frontend`

**Archivo**: `frontend/src/app/sw.ts`

```diff
-self.addEventListener("install", () => { /* skipWaiting controlado por la app */ });
-self.addEventListener("activate", serwist.handleActivate);
+self.addEventListener("install", () => {
+  self.skipWaiting();
+});
+self.addEventListener("activate", (event) => {
+  event.waitUntil(Promise.all([
+    deleteOldCaches(),
+    self.clients.claim(),
+  ]));
+  serwist.handleActivate(event);
+});
+
+const CACHE_VERSION_PREFIX = "cache-R1-";
+
+async function deleteOldCaches(): Promise<void> {
+  const cacheNames = await caches.keys();
+  await Promise.all(
+    cacheNames
+      .filter((name) => !name.startsWith(CACHE_VERSION_PREFIX) && !name.startsWith("serwist:"))
+      .map((name) => caches.delete(name)),
+  );
+}
```

**`clients.claim()`**: El nuevo SW reclama todas las pestañas abiertas inmediatamente. Sin esto, las pestañas existentes siguen usando el SW anterior hasta recargar.

**Confirmación API**: `serwist.handleActivate` existe en serwist >= 8. En `package.json` está `"serwist": "^9.5.11"` — correcto. El handler de serwist gestiona `waitUntil` internamente, pero podemos añadir `Promise.all` extra.

**Verificación**: `pnpm exec tsc --noEmit`. Abrir pestaña, deployar nuevo SW, recargar sin cerrar → nuevas reglas aplicadas.

---

### Fase R.3 — Fix `additionalPrecacheEntries`

**Skills**: `clean-code`, `senior-frontend`

**Archivo**: `frontend/src/app/serwist/[path]/route.ts`

```diff
-const revision = crypto.randomUUID();
+const revision = "v1";
```

Añadir `/~offline` a las páginas precacheadas:

```diff
  const STATIC_PAGES = [
    "/", "/adjustments", "/audit-log", "/categories",
    "/currencies", "/customers", "/dashboard", "/debts",
    "/exchange-rates", "/export", "/import", "/login",
    "/movements", "/notifications", "/products", "/products/new",
    "/purchases", "/reports", "/returns", "/roles", "/sales",
    "/settings", "/stock", "/suppliers", "/sync/incidents",
    "/transfers", "/users", "/warehouses", "/warehouses/new",
+   "/~offline",
  ] as const;
```

**Política de versionado**: `revision` se incrementa manualmente solo cuando cambia el shell (layout global, offline page). Los cambios en componentes de negocio NO requieren cambio de revision. Documentar en AGENTS.md.

**Verificación**: `pnpm exec tsc --noEmit`

---

### Fase R.4 — Offline fallback page precacheada

**Crear**: Ficheros:
1. `frontend/src/app/(offline)/layout.tsx` — layout mínimo sin providers ni dependencias
2. `frontend/src/app/(offline)/~offline/page.tsx` — página offline

**Layout mínimo** (`(offline)/layout.tsx`):
```tsx
export default function OfflineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Offline page** (`~offline/page.tsx`):
- `'use client'` para interactividad
- SVG icono inline (sin fetch externo, P1)
- Botón "Reintentar" que hace `location.reload()`
- Usar `Button` de `@/presentation/shared/components/ui/Button.tsx` (existe)
- Sin imports de TanStack Query, hooks, auth, o cualquier cosa que dependa de datos
- Tailwind classes inline

**Precache asegurado**:
- En `additionalPrecacheEntries` como `/~offline` (R.3)
- Regla `CacheFirst` para `pathname === "/~offline"` en sw.ts (R.1)
- Background task `precacheOfflineRoute` en `useBackgroundTasks.ts:114` ya intenta precachear `/~offline` — después de crear la página, esta tarea tendrá éxito

**Verificación**: Servidor apagado, navegar a cualquier ruta protegida → offline page

---

### Fase R.5 — Fix imagen producto 400 (doble encoding)

**Skills**: `clean-code`, `senior-frontend`, `senior-backend`

**Archivos**: 
- `frontend/src/presentation/shared/hooks/storage/useBackgroundTasks.ts` (línea 174)
- `frontend/src/infrastructure/images/useImageCache.ts` (línea 90)

**Diagnóstico real** (confirmado en codebase):

Hay **dos formatos** de URL de imagen:

| Formato | Dónde se usa | Regex |
|---------|-------------|-------|
| `/api/v1/{entityType}/{entityId}/images/{imageId}` | `ImageResolver.ts`, `useImageCache.ts` | `/^\/api\/v1\/(products\|suppliers\|customers)\/([^/]+)\/images\/(\d+)$/` |
| `/api/v1/images/{path}` | `useBackgroundTasks.ts:174` (prefetch) | ninguno |

El error 400 es del **formato #2**: `useBackgroundTasks.ts:174` hace:
```typescript
const res = await fetch(`/api/v1/images/${encodeURIComponent(key)}`);
```
Donde `key` es `p.mainImage` que contiene `%2Fproducts%2F...`. `encodeURIComponent` vuelve a codificar los `%` → `%252F`, resultando en `/api/v1/images/%252Fproducts%252F...` que el backend no reconoce o rechaza.

**Solución**: En `prefetchImagesBackground`, **no usar `encodeURIComponent`** si el key ya está encoded:

```typescript
// useBackgroundTasks.ts:174 — cambiar de:
const res = await fetch(`/api/v1/images/${encodeURIComponent(key)}`);
// a:
const path = key.startsWith("/") ? key : `/${key}`;
const res = await fetch(`/api/v1/images${path}`);
```

O mejor: detectar si el key es un path absoluto o relativo y construirlo correctamente.

**Para `useImageCache.ts`** (formato #1): La URL construida es `${API_BASE_URL}${imageKey}` donde `imageKey` es del formato `/api/v1/{entityType}/{entityId}/images/{imageId}`. Este formato NO tiene doble encoding — funciona correctamente. **No requiere cambios**.

**Verificación**: Navegar a producto con imagen → status 200. En Network tab, URL de imagen debe ser válida.

---

### Fase R.6 — Logout cleanup de SW caches de sesión

**Skills**: `clean-code`, `senior-frontend`

**Archivos**: 
- `frontend/src/app/sw.ts` — `clearUserCaches()`
- `frontend/src/infrastructure/storage/db.ts` — `destroyPersistence()` (buscar y modificar)

**sw.ts**: Actualizar `clearUserCaches()` para manejar `userId === null` y limpiar caches runtime:

```typescript
async function clearUserCaches(userId: string | null): Promise<void> {
  const cacheNames = await caches.keys();
  // Siempre limpiar caches de sesión (pages, rsc, others)
  // Conservar: next-js, next-css, js, css, fonts, images, gf-*, audio, data,
  //            next-data, media-images, offline (pública)
  const sessionCachePrefixes = [
    "cache-R1-pages",
    "cache-R1-rsc",
    "cache-R1-rsc-prefetch",
    "cache-R1-others",
  ];
  const sessionCaches = cacheNames.filter((name) =>
    sessionCachePrefixes.some((prefix) => name.startsWith(prefix)) ||
    (userId !== null && name.startsWith(`inventory-offline-${userId}`))
  );
  await Promise.all(sessionCaches.map((name) => caches.delete(name)));
}
```

**destroyPersistence()**: Buscar en `db.ts`. Debe añadir limpieza de caches `cache-R1-*` de sesión. Si la función existe, añadir:

```typescript
// En destroyPersistence(), después de limpiar caches inventory-*
const cacheNames = await caches.keys();
const sessionCaches = cacheNames.filter((name) =>
  name.startsWith("cache-R1-pages") ||
  name.startsWith("cache-R1-rsc") ||
  name.startsWith("cache-R1-rsc-prefetch") ||
  name.startsWith("cache-R1-others")
);
await Promise.all(sessionCaches.map((name) => caches.delete(name)));
```

**Flujo de logout** (confirmado en `useAuthStore.ts:81-96`):
1. `authRepository.logout()` → POST a backend
2. `destroyPersistence()` → limpia IDB + OPFS + caches legacy
3. `notifySwUserContext(null)` → envía SET_USER_CONTEXT a SW con `userId: null`
4. Zustand reset

**NOTA**: El mensaje `SET_USER_CONTEXT` con `userId: null` siempre debe activar `clearUserCaches(null)`. El SW actual solo limpia si `currentUserId && currentUserId !== prevUserId` — con `null` no entraba. El fix en R.6 corrige esto.

**Verificación**: Logout → Cache Storage: `cache-R1-pages`, `cache-R1-rsc`, `cache-R1-rsc-prefetch`, `cache-R1-others` eliminadas. `cache-R1-offline`, `cache-R1-next-js`, etc. conservadas.

---

### Fase R.7 — Background Sync para outbox pendiente

**Skills**: `clean-code`, `senior-frontend`

**Archivos**:
- `frontend/src/app/sw.ts`
- `frontend/src/infrastructure/storage/outbox.ts` (añadir `registerSync()`)

**Decisión arquitectónica**: El SW **no reimplementa** lógica de sync. En vez de duplicar `SyncService.processOutbox()` (536 líneas complejas con locks, temp IDs, dead letters, field errors), el SW **envía un mensaje al cliente** para que ejecute el sync:

```typescript
// sw.ts
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-outbox") {
    event.waitUntil(notifyClientToSync());
  }
});

async function notifyClientToSync(): Promise<void> {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({ type: "SYNC_OUTBOX" });
  }
}
```

**Frontend** (en el hook raíz o `Providers.tsx`), escuchar este mensaje:

```typescript
// En un useEffect global
navigator.serviceWorker.addEventListener("message", (event) => {
  if (event.data?.type === "SYNC_OUTBOX") {
    import("@/infrastructure/storage/SyncService").then(({ processOutbox }) => {
      processOutbox().catch(() => {});
    });
  }
});
```

**Registro de sync tag**: En `outbox.ts`, después de `addToOutbox()`, registrar el sync:

```typescript
// outbox.ts — añadir al final de addToOutbox()
export async function addToOutbox(entry: { ... }): Promise<void> {
  // ... existing code ...
  await db.add("outbox", outboxEntry);
  registerSync().catch(() => {}); // non-fatal
}

async function registerSync(): Promise<void> {
  if (typeof navigator === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  if ("sync" in registration) {
    await (registration as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register("sync-outbox");
  }
}
```

**Degradación graceful**: Si `SyncManager` no existe (Safari, Firefox), el sync tag no se registra. El usuario hace sync manual desde Settings — el outbox sigue acumulándose normalmente.

**Verificación**: Marcar offline, crear producto, reconectar → outbox se drena automáticamente.

---

### Fase R.8 — MaintenanceService: cleanup de caches SW viejas

**Skills**: `clean-code`, `senior-frontend`

**Archivo**: `frontend/src/infrastructure/storage/MaintenanceService.ts`

`MaintenanceService` ya existe y se ejecuta cada 30 min, boot y post-sync. Añadir operación:

```typescript
// En runAll(), después de cleanupTempFiles()
async cleanupSwCaches(): Promise<void> {
  try {
    const hasLocks = typeof navigator !== "undefined" && "locks" in navigator;
    const doCleanup = async () => {
      const cacheNames = await caches.keys();
      const currentPrefix = "cache-R1-";
      const stale = cacheNames.filter((name) => name.startsWith("cache-") && !name.startsWith(currentPrefix));
      if (stale.length > 0) {
        await Promise.all(stale.map((name) => caches.delete(name)));
        const { appLogger } = await import("@/infrastructure/logging/appLogger");
        appLogger.info(`cleaned ${stale.length} stale SW caches`);
      }
    };

    if (hasLocks) {
      await (navigator.locks as unknown as { request: (n: string, fn: () => Promise<void>) => Promise<void> })
        .request("sw-cache-cleanup", doCleanup);
    } else {
      await doCleanup();
    }
  } catch {
    // Non-fatal
  }
}
```

**`navigator.locks`**: Previene race conditions entre tabs. Si dos tabs ejecutan cleanup simultáneo, solo uno procede.

**Verificación**: Forzar `MaintenanceService.runAll()` → appLogger confirma caches limpiadas.

---

## 2. Codebase Audit (confirmaciones)

### Archivos existentes que se modifican

| Fichero | Existe? | Rol en el plan |
|---------|---------|----------------|
| `frontend/src/app/sw.ts` | ✅ sí | R.1, R.2, R.6, R.7 |
| `frontend/src/app/serwist/[path]/route.ts` | ✅ sí | R.3 |
| `frontend/src/infrastructure/storage/db.ts` | ✅ sí | R.6 — `destroyPersistence()` |
| `frontend/src/infrastructure/storage/outbox.ts` | ✅ sí | R.7 — añadir `registerSync()` |
| `frontend/src/infrastructure/storage/MaintenanceService.ts` | ✅ sí | R.8 |
| `frontend/src/presentation/shared/hooks/storage/useBackgroundTasks.ts` | ✅ sí | R.5 — fix encodeURIComponent |
| `frontend/src/presentation/shared/hooks/storage/useAuthStore.ts` | ✅ sí | Ya llama `destroyPersistence()` + `notifySwUserContext(null)` |
| `frontend/src/infrastructure/images/useImageCache.ts` | ✅ sí | R.5 — verificar, probablemente no requiere cambios |

### Archivos nuevos

| Fichero | Creado para |
|---------|-------------|
| `frontend/src/app/(offline)/layout.tsx` | Layout mínimo sin providers |
| `frontend/src/app/(offline)/~offline/page.tsx` | Offline fallback page |

### Confirmaciones del audit

| Pregunta | Respuesta |
|----------|-----------|
| `ExpirationPlugin` existe en serwist 9.5? | ✅ Sí, importable desde `"serwist"` |
| `SET_USER_CONTEXT` se envía en logout? | ✅ Sí, `useAuthStore.ts:94` con `userId: null` |
| `SyncService.processOutbox()` es complejo? | ✅ 536 líneas — **no reimplementar en SW**, mejor postMessage |
| Imagen doble encoding viene de `useBackgroundTasks.ts:174`? | ✅ Confirmado — usa `encodeURIComponent` sobre key ya encoded |
| `previousUserId` check bloquea cleanup con `null`? | ✅ Sí — el handler solo limpia si `currentUserId && ...` |
| Button existe en ui/? | ✅ `presentation/shared/components/ui/Button.tsx` |

---

## 3. Reglas de Ejecución

- **🏛️ P1–P5 son ley suprema**: R.1 tiene prioridad (P3, P4). R.7 es obligatorio (P5).
- **Una fase a la vez**: ejecutar → verificar → commit → preguntar al usuario si continuar
- **Commit por fase**: `git add . && git commit -m '<tipo>(<scope>): <mensaje>'`
- **Skills por fase**: `clean-code`, `senior-frontend`
- **Verificación**: `pnpm exec tsc --noEmit` + `pnpm lint`
- **Verificación offline**: Chrome DevTools → Application → Service Workers → check "Offline" → recargar
- **Verificación imágenes**: Navegar a producto con imagen → Network tab → status 200
- **Verificación caches**: Application → Cache Storage → `cache-R1-*` pobladas
- **Al cambiar CACHE_VERSION futuro**: Incrementar de `"R1"` a `"R2"` en sw.ts + incrementar `revision` en route.ts si cambia shell. Documentar en AGENTS.md.
- **Sin `console.log` en producción**: Usar `appLogger`

---

## 4. Archivos a Modificar (resumen)

| Archivo | Cambio | Fase |
|---------|--------|:----:|
| `frontend/src/app/sw.ts` | `runtimeCaching` explícito con estrategias reales | R.1 |
| `frontend/src/app/sw.ts` | `skipWaiting()` + `deleteOldCaches()` + `clients.claim()` | R.2 |
| `frontend/src/app/sw.ts` | `clearUserCaches()` maneja `null` + caches runtime | R.6 |
| `frontend/src/app/sw.ts` | `sync` listener + `notifyClientToSync()` por postMessage | R.7 |
| `frontend/src/app/serwist/[path]/route.ts` | `revision` estático + `/~offline` en precache | R.3 |
| `frontend/src/app/(offline)/layout.tsx` | (CREAR) Layout mínimo | R.4 |
| `frontend/src/app/(offline)/~offline/page.tsx` | (CREAR) Offline page (reusa Button) | R.4 |
| `frontend/src/presentation/shared/hooks/storage/useBackgroundTasks.ts` | Fix `encodeURIComponent` en prefetch | R.5 |
| `frontend/src/infrastructure/storage/db.ts` | `destroyPersistence()` añade cleanup `cache-R1-*` | R.6 |
| `frontend/src/infrastructure/storage/outbox.ts` | `registerSync()` después de `addToOutbox()` | R.7 |
| `frontend/src/infrastructure/storage/MaintenanceService.ts` | `cleanupSwCaches()` en `runAll()` | R.8 |

---

## 5. Dependencias

```
R.1 (runtimeCaching)
  ├── R.2 (activate+cleanup) — necesita cache names de R.1
  ├── R.3 (precache) — independiente
  ├── R.4 (offline page) — necesita R.3 (precache entry)
  ├── R.5 (image fix) — independiente
  └── R.6 (logout) — necesita R.1 (nombres)
        └── R.8 (maintenance) — necesita R.1 + R.2
R.7 (background sync) — independiente
```

Orden: **R.1 → R.2 → R.3 → R.4 → R.5 → R.6 → R.7 → R.8**

R.1, R.3, R.5 y R.7 pueden ejecutarse en paralelo sin conflictos de merge.
