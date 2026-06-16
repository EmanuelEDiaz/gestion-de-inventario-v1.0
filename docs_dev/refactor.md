# Plan: Fase R — Service Worker Caching Real (offline SW)

> Created: 2026-06-15 | v5 — Incorpora feedback review, codebase audit real. Marca COMPLETED fases ya implementadas.
> Extiende `task_plan.md`: reglas, principios P1–P5 y convenciones aplican. Fases R y G.

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
- Caches por userId ("Namespace de cache SW por userId") — **concesión pragmática**: el plan optó por no incluir userId en nombres de cache porque Serwist 9.5 no expone `cacheName` dinámicamente. En su lugar se usa flag `sessionCachingPaused`. Documentado en `AGENTS.md`.
- Logout cleanup de caches ("E. Política de invalidación de SW al logout")
- Mantenimiento periódico de caches ("Cleanup de caches SW viejas", Objetivo 4)

---

## 1. Fases de Implementación

### ✅ Fase R.1 — Custom `runtimeCaching` con estrategias reales (COMPLETED)

> **Commit**: `6d7726c` — feat(sw): custom runtimeCaching with real strategies
> **Archivo**: `frontend/src/app/sw.ts`

Ya implementado en sw.ts: lines 27-47. Contiene todas las reglas de runtimeCaching con estrategias reales.

**Cambio adicional post-review**: `networkTimeoutSeconds: 3` → `5` en todas las reglas NetworkFirst (RSC, data, media-images, pages, rsc-prefetch, others). 3s es muy corto en redes lentas (3G, VPN, LAN congestionada).

```diff
- handler: new NetworkFirst({ cacheName: CACHE("pages"), networkTimeoutSeconds: 3, ... })
+ handler: new NetworkFirst({ cacheName: CACHE("pages"), networkTimeoutSeconds: 5, ... })
```

---

### ✅ Fase R.2 — Activación inmediata + cleanup de caches viejas + clients.claim (COMPLETED)

> **Archivo**: `frontend/src/app/sw.ts`

Ya implementado en sw.ts: lines 49-86:
- `skipWaiting: false` en Serwist config (line 50) pero **`skipWaiting()` explícito en install handler** (line 78)
- `deleteOldCaches()` (line 68)
- `clients.claim()` en activate (line 83)
- `serwist.handleActivate(event)` (line 85)

Sin cambios requeridos.

---

### ✅ Fase R.6 — Logout cleanup de SW caches de sesión (COMPLETED)

> **Archivo**: `frontend/src/app/sw.ts`, `frontend/src/infrastructure/storage/db.ts`

Ya implementado:
- `sw.ts` lines 102-116: `clearUserCaches()` con `SESSION_CACHE_PREFIXES` + `userId !== null` guard
- `db.ts` lines 832-836: `destroyPersistence()` limpia `cache-R1-*` session caches
- `db.ts` lines 1190-1208: `clearSessionData()` limpia session caches via `caches.keys()`

**Cambio post-review**: El handler actual en sw.ts line 118-131 ya correctamente maneja null (condición `currentUserId !== prevUserId` se activa al pasar de "abc" a null). Sin embargo, la **race condition** persiste: `notifySwUserContext(null)` usa `postMessage` que es asíncrono — la navegación a `/login` puede ocurrir antes de que el SW termine `clearUserCaches`. Solución: SW debe enviar ACK al cliente después de limpiar.

**`sw.ts`**: After `clearUserCaches()`, notify the client:
```typescript
self.addEventListener("message", async (event: ExtendableMessageEvent) => {
  // ... existing SET_USER_CONTEXT handler ...
  if (event.data?.type === "SET_USER_CONTEXT") {
    const prevUserId = currentUserId;
    currentUserId = event.data.payload.userId;
    if (currentUserId !== prevUserId) {
      await clearUserCaches(currentUserId);
      event.source?.postMessage({ type: "CACHES_CLEARED" });
    }
    return;
  }
});
```

**Cliente** (`useAuthStore.logout()`): Reemplazar el redirect directo con ACK-based:
```typescript
// En el componente DashboardLayout o Providers, escuchar:
navigator.serviceWorker.addEventListener("message", (event) => {
  if (event.data?.type === "CACHES_CLEARED") {
    window.location.href = '/login';
  }
});
```

**Sin cambios en `clearSessionData()`** ni `destroyPersistence()` — ya limpian correctamente.

---

### ✅ Fase R.7 — Background Sync para outbox pendiente (COMPLETED)

> **Archivos**: `frontend/src/app/sw.ts`, `frontend/src/infrastructure/storage/outbox.ts`

Ya implementado:
- `sw.ts` lines 89-100: `sync` listener + `notifyClientToSync()` por postMessage
- Falta añadir `registerSync()` en outbox.ts: después de `addToOutbox()`, registrar el sync tag

---

### ✅ Fase R.8 — MaintenanceService: cleanup de caches SW viejas (COMPLETED)

> **Archivo**: `frontend/src/infrastructure/storage/MaintenanceService.ts`

Ya implementado en lines 233-246 (`cleanupSwCaches`). Filtra caches con prefijo `cache-` pero no `cache-R1-` ni `serwist:`.

**Mejora post-review**: Añadir `navigator.locks` para evitar race conditions entre tabs:
```typescript
private async cleanupSwCaches(): Promise<void> {
  const doCleanup = async () => {
    const cacheNames = await caches.keys();
    const currentPrefix = "cache-R1-";
    const stale = cacheNames.filter((name) => name.startsWith("cache-") && !name.startsWith(currentPrefix));
    if (stale.length > 0) {
      await Promise.all(stale.map((name) => caches.delete(name)));
      appLogger.info(`[Maintenance] Cleaned ${stale.length} stale SW caches`);
    }
  };
  if (typeof navigator !== "undefined" && "locks" in navigator) {
    await (navigator.locks as any).request("sw-cache-cleanup", doCleanup);
  } else {
    await doCleanup();
  }
}
```

---

### Fase R.3 — Fix `additionalPrecacheEntries`

**Skills**: `clean-code`, `senior-frontend`

**Archivo**: `frontend/src/app/serwist/[path]/route.ts`

La línea 3 ya usa `const revision = "v1"` — **no requiere cambio**. El `/~offline` ya está en STATIC_PAGES (line 13).

**Confirmación**: route.ts ya tiene todo correcto. Fase reducida a verificación.

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
- `/~offline` ya en `additionalPrecacheEntries` (R.3 verificado)
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

**Código ACTUAL** (ya no usa `encodeURIComponent`):
```typescript
// useBackgroundTasks.ts:177
const res = await fetch(`/api/v1/images/${key.startsWith("/") ? key.slice(1) : key}`, { headers });
```

Esto ya arregla el doble encoding. **Sin embargo**, si `key` es una URL absoluta (`https://...`), el guard actual produce `/api/v1/images/https://...` que es inválido.

**Fix adicional — guard de URL absoluta**:
```typescript
// Reemplazar línea 177 con:
const rawPath = key.startsWith("http") ? new URL(key).pathname : key;
const normalizedPath = rawPath.startsWith("/") ? rawPath.slice(1) : rawPath;
const res = await fetch(`/api/v1/images/${normalizedPath}`, { headers });
```

**Para `useImageCache.ts`** (formato #1): La URL construida es `${API_BASE_URL}${imageKey}` donde `imageKey` es del formato `/api/v1/{entityType}/{entityId}/images/{imageId}`. Este formato NO tiene doble encoding — funciona correctamente. **No requiere cambios**.

**Verificación**: Navegar a producto con imagen → status 200. En Network tab, URL de imagen debe ser válida. Probar con key absoluto (`https://...`) y relativo (`/products/...`).

---

### Fase G.1 — Namespace de SW caches por userId

**Skills**: `clean-code`, `senior-frontend`

**Referencia `task_plan.md`**: §250 ("Namespace de cache SW por `userId`"), §245-246 ("No cachear páginas protegidas"), §354-356 (E — SW invalidación al logout)

**Archivos**: `frontend/src/app/sw.ts`, `frontend/src/infrastructure/storage/db.ts`

**Problema**: Caches de sesión no tienen userId en su nombre. Todos los usuarios comparten `cache-R1-pages`, `cache-R1-rsc`, etc. Al logout se limpian, pero el SW re-cachea inmediatamente la página de login bajo el mismo nombre.

**Decisión arquitectónica**: Como Serwist 9.5 no expone los `cacheName` dinámicamente en sus strategies, se opta por:

1. Mantener session caches sin userId en el nombre (incompatible con §250 puro, pero pragmático)
2. **Flag `sessionCachingPaused`** que evita cachear session caches después de logout (G.2)
3. **`clearSessionData()` acepta `userId?: string`** para loggear qué usuario limpió (no para filtrar caches — son compartidas)

**Cambio en `clearSessionData()`** (`db.ts`):
```typescript
export async function clearSessionData(userId?: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(SESSION_STORES, 'readwrite');
    await Promise.all(SESSION_STORES.map(store => tx.objectStore(store).clear()));
    await tx.done;
  } catch (error) {
    import('@/infrastructure/logging/appLogger').then(m =>
      m.appLogger.error('Failed to clear session data', error)
    );
  }
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(k => SESSION_CACHE_PREFIXES.some(p => k.startsWith(p)))
          .map(k => caches.delete(k)),
      );
      if (userId) {
        import('@/infrastructure/logging/appLogger').then(m =>
          m.appLogger.info(`Session caches cleared for user ${userId}`)
        );
      }
    }
  } catch (error) {
    import('@/infrastructure/logging/appLogger').then(m =>
      m.appLogger.error('Failed to clear session caches', error)
    );
  }
}
```

**Verificación**: `pnpm exec tsc --noEmit` + `pnpm lint`. Logout → session caches limpiadas → login page NO está en session cache.

---

### Fase G.2 — Pausar session caching en SW tras logout

**Skills**: `clean-code`, `senior-frontend`

**Archivo**: `frontend/src/app/sw.ts`

**Problema**: Tras logout, el SW re-cachea la navegación a `/login` bajo `cache-R1-pages`. Si la limpieza de G.1 ocurrió, el cache se recrea vacío con la página de login.

**Implementación**:

Flag `let sessionCachingPaused = false` en scope del SW:

```typescript
let currentUserId: string | null = null;
let sessionCachingPaused = false;
```

En `SET_USER_CONTEXT` handler:
```typescript
if (event.data?.type === "SET_USER_CONTEXT") {
  const prevUserId = currentUserId;
  currentUserId = event.data.payload.userId;
  if (currentUserId === null) {
    sessionCachingPaused = true;
    await clearUserCaches(prevUserId);
    event.source?.postMessage({ type: "CACHES_CLEARED" });
  } else {
    sessionCachingPaused = false;
    if (currentUserId !== prevUserId) {
      await clearUserCaches(prevUserId);
    }
  }
  return;
}
```

En `CACHE_PAUSE` message handler (redundante si SET_USER_CONTEXT ya activa el flag, pero útil como doble seguridad):
```typescript
if (event.data?.type === "CACHE_PAUSE") {
  sessionCachingPaused = true;
}
```

**Interceptor de session caching**: Serwist no tiene hooks pre/post response. Solución: en el mismo `useAuthStore.logout()`, **después de `clearSessionData()` pero antes del redirect**, enviar un mensaje SW adicional `{ type: "CACHE_PAUSE" }`. El SW lo desactiva al recibir `SET_USER_CONTEXT` con userId real.

**Verificación**: Logout → cache `cache-R1-pages` NO existe (ni siquiera con login page). Login → se reanuda cacheo normalmente.

---

### Fase G.3 — Conectar QuotaWarningBanner → MaintenanceService.runOnce()

**Skills**: `clean-code`, `senior-frontend`

**Archivo**: `frontend/src/presentation/shared/components/feedback/QuotaWarningBanner.tsx`

**Problema**: `MaintenanceService` ya ejecuta pruning programado cada 30 min, pero no se dispara cuando se detecta presión de cuota (<20%). Solo se muestra el banner. `runOnce()` existe como método estático (MaintenanceService.ts:30).

**Referencia `task_plan.md`**: §447 ("Al detectar presión de cuota, ejecutar pruning"), §462-468 (alarmas)

**Implementación**:

En `check()` de `QuotaWarningBanner`, cuando `free < 20`, disparar `MaintenanceService.runOnce()` en background sin bloquear UI:

```typescript
useEffect(() => {
  let mounted = true;
  async function check() {
    const result = await checkStorageQuota();
    if (!mounted || !result) return;
    const free = 100 - result.percentUsed;
    setPercentFree(free);
    if (free < 20) {
      setQuotaState(free < 5 ? 'critical' : 'warn');
      import('@/infrastructure/storage/MaintenanceService')
        .then(m => m.MaintenanceService.runOnce())
        .catch(() => {});
    } else {
      setQuotaState('ok');
    }
  }
  check();
  const interval = setInterval(check, CHECK_INTERVAL_MS);
  return () => { mounted = false; clearInterval(interval); };
}, []);
```

**Verificación**: Forzar cuota <20% → `appLogger` confirma operaciones de pruning ejecutadas además del banner visible.

---

### Fase G.4 — Unificar logout: sidebar usa mismo dialog que header

**Skills**: `clean-code`, `senior-frontend`

**Archivo**: `frontend/src/presentation/shared/components/layout/DashboardLayout.tsx`

**Problema**: El botón "Cerrar sesión" en el error state (línea 304) usa `handleLogout` que ejecuta `logout()` sin `LogoutConfirmDialog`, sin verificar cambios pendientes.

**Referencia `task_plan.md`**: §339-346 (B — Logout con cambios pendientes: siempre mostrar ConfirmDialog)

**Implementación**:

Reemplazar `handleLogout` para usar el mismo flujo que `handleLogoutRequest` (dialog + pending count):
```typescript
const handleLogout = useCallback(async () => {
  try { setPendingForLogout(await getOutboxCount()); } catch { setPendingForLogout(0); }
  setShowLogoutDialog(true);
}, []);
```

**Verificación**: Click "Cerrar sesión" en error state → muestra LogoutConfirmDialog con pending count.

---

### Fase G.5 — Cleanup: eliminar código muerto en SW + verificar SESSION_STORES

**Skills**: `clean-code`

**Archivos**: `frontend/src/app/sw.ts`, `frontend/src/infrastructure/storage/db.ts`

**Implementación**:

1. En `sw.ts`, eliminar condicion muerta de `clearUserCaches()`:
```typescript
async function clearUserCaches(userId: string | null): Promise<void> {
  const cacheNames = await caches.keys();
  const toDelete = cacheNames.filter((name) =>
    SESSION_CACHE_PREFIXES.some((p) => name.startsWith(p))
  );
  await Promise.all(toDelete.map((name) => caches.delete(name)));
}
```

2. En `db.ts`, verificar `SESSION_STORES`:
   - `conflicts/incidents` no existe como store → `deadLetter` + `corruptionQueue` lo cubren. Añadir comentario inline documentando la decisión.
   - No requiere cambios de store.

**Verificación**: `pnpm exec tsc --noEmit` + `pnpm lint` sin errores.

---

## 2. Codebase Audit (contra código real)

### 2.1 Fases YA implementadas (refactor.md desactualizado)

| Fase | Archivo | Líneas | Estado |
|------|---------|--------|--------|
| R.1 — runtimeCaching real | `sw.ts` | 27-47 | ✅ COMPLETED |
| R.2 — skipWaiting + clients.claim + deleteOldCaches | `sw.ts` | 68-86 | ✅ COMPLETED |
| R.6 — logout cleanup session caches | `sw.ts`, `db.ts` | 102-116, 1190-1208 | ✅ COMPLETED |
| R.7 — Background Sync via postMessage | `sw.ts` | 89-100 | ✅ Parcial (falta registerSync en outbox.ts) |
| R.8 — MaintenanceService cleanupSwCaches | `MaintenanceService.ts` | 233-246 | ✅ COMPLETED (sin locks — mejora posible) |
| R.3 — revision estática + /~offline en precache | `route.ts` | 3, 13 | ✅ COMPLETED |

### 2.2 Archivos a MODIFICAR

| Archivo | Cambio | Fase | Prioridad |
|---------|--------|:----:|:---------:|
| `sw.ts` | `networkTimeoutSeconds: 3` → `5` en NetworkFirst | R.1 | Alta |
| `sw.ts` | ACK postMessage tras `clearUserCaches()` | R.6 | Alta |
| `sw.ts` | `sessionCachingPaused` flag + CACHE_PAUSE handler | G.2 | Alta |
| `sw.ts` | `navigator.locks` en `deleteOldCaches()` | R.2 | Media |
| `sw.ts` | Eliminar condicion muerta `inventory-offline-${userId}` | G.5 | Baja |
| `db.ts` | `clearSessionData()` acepta `userId?: string` | G.1 | Alta |
| `db.ts` | Comentario `conflicts/incidents` | G.5 | Baja |
| `outbox.ts` | `registerSync()` después de `addToOutbox()` | R.7 | Alta |
| `MaintenanceService.ts` | `navigator.locks` en `cleanupSwCaches()` | R.8 | Media |
| `useBackgroundTasks.ts` | Guard URL absoluta en image fix | R.5 | Media |
| `QuotaWarningBanner.tsx` | Llamar `MaintenanceService.runOnce()` | G.3 | Alta |
| `DashboardLayout.tsx` | Unificar logout con dialog | G.4 | Media |

### 2.3 Archivos a CREAR

| Archivo | Para | Prioridad |
|---------|------|:---------:|
| `frontend/src/app/(offline)/layout.tsx` | Layout mínimo offline | Alta |
| `frontend/src/app/(offline)/~offline/page.tsx` | Offline fallback page | Alta |

### 2.4 Archivos a REUSE (sin cambios)

| Archivo | Razón |
|---------|-------|
| `Button.tsx` | Existe en `ui/Button.tsx` — offline page lo reutilizará |
| `useImageCache.ts` | Formato #1 sin doble encoding — no requiere cambios |
| `useAuthStore.ts` | Ya llama `destroyPersistence()` + `notifySwUserContext(null)` — flujo correcto |

### 2.5 Archivos DELETE / código muerto

| Código | Razón |
|--------|-------|
| `sw.ts:113` — `inventory-offline-${userId}` | Nunca matchea; ningún cache se crea con ese prefijo |
| `useBackgroundTasks.ts:177` — guard actual | Reemplazar con guard de URL absoluta |

---

## 3. Mejora recomendada: Pruning Strategy

### Estado actual

| Dimensión | Implementado | Gap |
|-----------|:------------:|:---:|
| IDB date pruning (90-180d) | ✅ | Format checker por sample ✅ |
| Image LRU (100MB OPFS) | ✅ | Last-access tracking ✅ |
| Stale SW cache cleanup (version) | ✅ | Sin `navigator.locks` |
| Session cache cleanup on logout | ✅ | Sin userId namespace |
| Quota monitoring (5min) | ✅ | No dispara pruning ❌ |
| OPFS temp file cleanup | ✅ | |
| Download chunks cleanup | ✅ | |

### Recomendaciones

1. **Quota-triggered pruning**: `QuotaWarningBanner` debe llamar `MaintenanceService.runOnce()` (G.3) — ya en el plan.

2. **SW cache TTL para session caches**: Si un usuario nunca cierra sesión, `cache-R1-pages` crece indefinidamente. Añadir TTL opcional de 7 días en `MaintenanceService.cleanupSwCaches()`:
```typescript
// Además de limpiar caches viejas de versiones anteriores, limpiar session caches con TTL
const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
// Nota: Cache API no expone fecha de creación directamente.
// Como workaround, se podría cachear un marcador de timestamp por cache name.
// Alternativa: simplemente limpiar session caches periódicamente (más agresivo).
// Decisión: NO implementar TTL por ahora — las session caches son pequeñas y se limpian al logout.
```

3. **`navigator.locks` en cleanup cross-tab**: El código actual de `cleanupSwCaches` no usa locks. Añadirlos para prevenir race conditions entre tabs.

4. **Monitoreo de tamaño de SW caches**: Añadir métrica en HealthPanel que estime el storage usado por SW caches usando `caches.match()` o `cache.keys()` iterativo.

---

## 4. Reglas de Ejecución

- **🏛️ P1–P5 son ley suprema**: R.4 tiene prioridad (P3, P4). G.3 es obligatorio (Objetivo 4).
- **Una fase a la vez**: ejecutar → verificar → commit → preguntar al usuario si continuar
- **Commit por fase**: `git add . && git commit -m '<tipo>(<scope>): <mensaje>'`
- **Skills por fase**: `clean-code`, `senior-frontend`
- **Verificación**: `pnpm exec tsc --noEmit` + `pnpm lint`
- **Sin `console.log` en producción**: Usar `appLogger`

---

## 5. Dependencias y Orden

```
R.4 (offline page) — independiente (CREAR)
R.5 (image fix) — independiente (MODIFICAR)
R.7 (registerSync en outbox.ts) — independiente (MODIFICAR)

G.1 (clearSessionData con userId) → G.2 (sessionCachingPaused)
G.3 (quota→maintenance) — independiente
G.4 (unificar logout) — independiente
G.5 (cleanup) — independiente

Post-R: Actualizar networkTimeoutSeconds 3→5 en sw.ts + ACK + locks + absolute URL guard
```

Orden recomendado: **R.4 → R.5 → R.7 → G.1 → G.2 → G.3 → G.4 → G.5** + cambios post-review dispersos.
