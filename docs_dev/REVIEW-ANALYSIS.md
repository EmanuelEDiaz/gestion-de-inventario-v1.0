# Review Analysis — Plan vs Codebase vs Feedback

> Created: 2026-06-15 | Cross-references `docs_dev/refactor.md`, `docs_dev/task_plan.md`, and actual codebase

## 1. Feedback Point-by-Point: Verdict + Opinion

### P1. Orden de runtimeCaching
**Opine**: Ya estaba implícito en el plan (refactor.md:156). No necesita cambios al plan — la prioridad: auth > api/images > general api > html > catch-all.

### P2. maxEntries: 256 y HMR en dev
**Opine**: Correcto en producción (chunks hash-versionados, seguros para CacheFirst). En dev con Turbopack, HMR genera muchos chunks — pero `256` es suficiente para un ciclo de desarrollo normal (se supera el límite si dejas la app abierta días). Si el usuario ve evicción temprana, subir a `512`. **No cambiar ahora** — solo documentar en AGENTS.md.

### P3. clearUserCaches(null): timing race condition
**Opine**: **Éste es el punto más importante.** El plan decía "con `null` no entraba" (refactor.md:355) — esto es **falso para el código actual**. `sw.ts:127` usa `currentUserId !== prevUserId`, que SÍ se activa con `null`. La revisión lo notó correctamente como la causa raíz.

**Verdadera causa raíz**: `useAuthStore.logout()` (line 107) envía `notifySwUserContext(null)` y **en la misma microtask** hace `set({ ...initialState })` (line 108). La pregunta es si el `window.location.href = '/login'` (no en el store, pero ocurre en el componente) se ejecuta ANTES de que el SW procese el mensaje y borre los caches. Como `postMessage` es asíncrono, hay una **race condition real**: la navegación puede ocurrir antes de que el SW termine `clearUserCaches`.

**Fix requerido**: El store de auth no controla el timing de navegación. La navegación a `/login` ocurre en el componente que escucha `isAuthenticated === false`. Debe hacerse **después de confirmar** que el SW limpió. Solución: que el SW envíe un `ACK` post-cleanup, o usar un delay. Mi recomendación:

```typescript
// En sw.ts, después de clearUserCaches:
event.source?.postMessage({ type: "CACHES_CLEARED" });

// En el listener global del componente logout:
navigator.serviceWorker.addEventListener("message", (event) => {
  if (event.data?.type === "CACHES_CLEARED") {
    window.location.href = '/login';
  }
});
```

Esto garantiza orden correcto sin race condition.

### P4. CacheFirst para /~offline sin TTL
**Opine**: Es una página pequeña (~1KB HTML). Sin TTL es correcto — debe durar para siempre (sirve offline sin datos de sesión, no contiene info sensible). No añadiría ExpirationPlugin. **Mantener como está**.

### P5. Namespace por userId (G.1-G.2)
**Opine**: El plan ya reconoce que Serwist 9.5 no expone cacheName dinámicamente. El "pragmatic compromise" es correcto: mantener session caches sin userId, pero limpiar al logout. Documentar en AGENTS.md es buena idea.

### P6. navigator.locks fallback
**Opine**: Ya cubierto en el plan (R.8) y en el código actual (MaintenanceService.cleanupSwCaches). **Sin cambios**.

### P7. QuotaWarningBanner → MaintenanceService.runOnce()
**Opine**: `runOnce()` existe (MaintenanceService.ts:30). El banner actual **NO** lo llama (solo muestra UI). G.3 es necesario. El plan es correcto.

### P8. networkTimeoutSeconds: 3 demasiado corto
**Opine**: **Acuerdo con la revisión.** 3s puede ser poco en redes lentas (3G, LAN congestionada, VPN). Subir a **5s** para todas las reglas NetworkFirst. Cambiar en el plan y en el código actual (sw.ts).

### P9. Doble encoding: key puede ser URL absoluta
**Opine**: **Acuerdo.** El código actual (`useBackgroundTasks.ts:177`) usa `key.startsWith("/") ? key.slice(1) : key` — esto asume que `key` es relativo. Si `key` llega como `"https://..."`, `startsWith("/")` es falso y se pasa sin prefijo, resultando en `/api/v1/images/https://...` que es inválido. Añadir guard:

```typescript
const path = key.startsWith("http") ? new URL(key).pathname : key;
const res = await fetch(`/api/v1/images/${path.startsWith("/") ? path.slice(1) : path}`, { headers });
```

### P10. Safari Background Sync fallback
**Opine**: Correcto como "future improvement". No bloquearía R.7 por esto. **Sin cambios**.

### P11. clients.claim() + skipWaiting() — hydration
**Opine**: El código actual ya tiene ambos (sw.ts:77-86). Si hay riesgo de hydration, es conocido y no ha causado issues. **Sin cambios**.

---

## 2. Codebase Audit: PLAN → Actual Code (DELETE / MODIFY / CREATE / REUSE)

### 2.1 Archivos a MODIFICAR

| Archivo | Actual | Plan dice | Realidad |
|---------|--------|-----------|----------|
| `sw.ts` | R.1 ✅ ya implementado | Tiene runtimeCaching real | Parcial — `networkTimeoutSeconds: 3` presente; orden ok |
| `sw.ts` | R.2 ✅ skipWaiting + clients.claim | Añadir en activate | Ya implementado en líneas 77-86. **Plan desactualizado** — R.2 está hecho |
| `sw.ts` | R.6 clearUserCaches | Manejar null + session caches | **Ya implementado** (lines 109-116). Maneja `null` correctamente |
| `sw.ts` | R.7 Background Sync | sync listener + postMessage | ✅ Ya implementado (lines 89-100) |
| `sw.ts` | G.1-G.2 sessionCachingPaused | Flag + CACHE_PAUSE handler | ❌ **No implementado** — requiere añadirse |
| `sw.ts` | G.5 cleanup dead code | Eliminar `inventory-offline-${userId}` | Código muerto presente (line 113). **Pendiente** |
| `route.ts` | R.3 revision | `revision: "v1"` + /~offline precache | ❌ **No verificado** — probablemente `randomUUID` |
| `MaintenanceService.ts` | R.8 cleanupSwCaches | Añadir cleanup | ✅ **Ya implementado** (lines 233-246) |
| `MaintenanceService.ts` | cleanupSwCaches locks | navigator.locks fallback | ❌ **El código actual NO usa locks** — usa simple filter+delete |
| `db.ts` destroyPersistence | R.6 cleanup session caches | Añadir cache-R1-* | ✅ **Ya implementado** (lines 832-836) |
| `db.ts` clearSessionData | G.1 filtrar por userId | Aceptar userId opcional | ❌ **No implementado** — función sin parámetros |
| `useBackgroundTasks.ts` | R.5 fix encodeURIComponent | Arreglar doble encoding | ✅ **Ya arreglado** (line 177). Usa `startsWith("/")` |
| `QuotaWarningBanner.tsx` | G.3 runOnce() | Llamar MaintenanceService | ❌ **No implementado** — solo muestra UI |
| `DashboardLayout.tsx` | G.4 unificar logout | handleLogout → dialog | ❌ **No implementado** |

### 2.2 Archivos a CREAR

| Archivo | Status | Prioridad |
|---------|--------|-----------|
| `(offline)/layout.tsx` | ❌ No existe | Alta — R.4 |
| `(offline)/~offline/page.tsx` | ❌ No existe | Alta — R.4 |

### 2.3 Archivos a REUSE (sin cambios)

| Archivo | Razón |
|---------|-------|
| `useImageCache.ts` (R.5) | Formato #1 no tiene doble encoding. **Sin cambios** |
| `Button.tsx` | Existe. Offline page lo reutilizará |
| `useAuthStore.ts` (R.6) | Ya llama `destroyPersistence()` + `notifySwUserContext(null)`. **Sin cambios** |

### 2.4 Archivos DELETE

| Archivo | Razón |
|---------|-------|
| `sw.ts:113` — `inventory-offline-${userId}` legacy code (G.5) | Nunca matchea; ningún cache se crea con ese prefijo |

### 2.5 Fases COMPLETED (plan desactualizado)

| Fase | En plan | En código |
|------|---------|-----------|
| **R.1** (runtimeCaching real) | Pendiente | ✅ YA implementado en sw.ts |
| **R.2** (skipWaiting + clients.claim + deleteOldCaches) | Pendiente | ✅ YA implementado en sw.ts |
| **R.6** (logout cleanup de caches) | Pendiente | ✅ YA implementado en sw.ts + db.ts |
| **R.7** (Background Sync) | Pendiente | ✅ YA implementado en sw.ts |
| **R.8** (MaintenanceService cleanupSwCaches) | Pendiente | ✅ YA implementado en MaintenanceService.ts |

**Conclusión**: refactor.md está desactualizado en al menos 5 fases. El código ya implementó R.1, R.2, R.6, R.7, R.8. Solo faltan R.3, R.4, R.5 (parcial), G.1-G.5.

---

## 3. Pruning Strategy: Diagnosis + Recommendations

### 3.1 Current State

| Dimensión | Actual | Gap |
|-----------|--------|-----|
| **IDB date pruning** | Rolling 90-180d ✅ | Formato verificador por sample ✅ |
| **Image LRU** | 100MB OPFS limit ✅ | Last-access tracking ✅ |
| **SW cache stale cleanup** | Versiones viejas (cache-*) ✅ | No hay monitoreo de tamaño |
| **Session cache cleanup** | Al logout (clearSessionData) ✅ | Sin userId namespace |
| **Quota monitoring** | Cada 5 min (QuotaWarningBanner) ✅ | No dispara pruning automático ❌ |
| **OPFS temp files** | Cleanup de *.tmp ✅ | |
| **Download chunks** | Committed > 24h ✅ | |

### 3.2 Recommended Improvements

1. **Quota-triggered pruning**: Cuando `free < 20%`, `QuotaWarningBanner` debe llamar `MaintenanceService.runOnce()` (G.3). Esto ya está en el plan como G.3.

2. **SW cache size monitoring**: No hay `caches.match()` para medir tamaño real de cada cache. Recomiendo añadir métrica opcional que estime el storage usado por SW caches y reportarlo en HealthPanel.

3. **SW session cache time limit**: Aunque las session caches se borran al logout, si el usuario nunca cierra sesión durante semanas, las caches crecen. Recomiendo un TTL opcional de 7 días para session caches (`cache-R1-pages`, `rsc`, `others`) ejecutado por `MaintenanceService.cleanupSwCaches()`.

4. **Cross-tab cleaner**: `navigator.locks` para cleanup de caches SW está implementado en el plan R.8 pero **no en el código actual**. Se debe añadir.

---

## 4. Refined Plan: What to Actually Do

### Remaining work (ordered by dependency):

```
PRIORITY 1 (bloquea offline functionality):
  R.3 — route.ts: revision estática + /~offline precache
  R.4 — Crear (offline)/layout.tsx + ~offline/page.tsx

PRIORITY 2 (comportamiento correcto):
  G.1 — clearSessionData acepta userId
  G.2 — sessionCachingPaused + CACHE_PAUSE en SW
  G.3 — QuotaWarningBanner → runOnce()

PRIORITY 3 (UX):
  G.4 — DashboardLayout logout dialog
  G.5 — cleanup código muerto
  Fix image absolute URL guard
  Change networkTimeoutSeconds: 3 → 5

PRIORITY 4 (verificación/diagnóstico):
  Documentar userId limitation en AGENTS.md
  Añadir ACK para clearUserCaches timing
```

### Específicamente, actualizar `sw.ts` (lo que YA existe debe quedar):

- **networkTimeoutSeconds**: `3` → `5` en todas las reglas NetworkFirst
- **clearUserCaches**: enviar `postMessage({ type: "CACHES_CLEARED" })` al cliente
- **sessionCachingPaused flag**: añadir `let sessionCachingPaused = false`
- **CACHE_PAUSE message handler**: añadir
- **Legacy dead code**: eliminar `inventory-offline-${userId}` check
- **navigator.locks**: envolver cleanupSwCaches en locks

### Refactor.md debe actualizarse:

1. Marcar R.1, R.2, R.6, R.7, R.8 como COMPLETED (ya no son tareas)
2. Ajustar `networkTimeoutSeconds: 3` → `5` en todos los ejemplos
3. Añadir guard de URL absoluta en R.5
4. Añadir sección de verificación post-implementación
