# Plan M: Cortar Loop Infinito en Descarga Corrupta + Reintentar Controlado

> Created: 2026-06-13 | v1 — Basado en error reportado: `[DownloadQueue] validation failed for products-0` se repite infinitamente. El chunk corrupto nunca se persiste, `getCachedCount('products')` siempre devuelve 0, y `DashboardLayout` re-triggers el boot cycle al ver `appPhase === 'idle'`. Task_plan.md línea 583 dice: `corrupted` → **No reintentar automático infinito**. El código viola esta regla.
>
> ⚠️ **Plan L ya está implementado y commiteado** (90f492b). Este es el siguiente plan.

---

## Problema: Loop Infinito en Carga Inicial con Datos Corruptos

### Síntoma
```
Toast: "Datos corruptos en products. El checksum del chunk no coincide..."
Consola: [ERROR] [DownloadQueue] validation failed for products-0  (se repite cada ~5s)
         [WARN] [AppLoader] products descarga parcial
```

El toast aparece una vez por ciclo de boot. El número de repeticiones en consola corresponde al loop infinito.

### Root Cause

```
flowchart TD
    A[Boot cycle comienza] --> B[products phase: downloadEntity]
    B --> C[processChunk valida ALL items inválidos]
    C --> D[nada se persiste a IDB]
    D --> E[setPhase('categories') avanza igual]
    E --> F[... suppliers → setPhase('idle')]
    F --> G[DashboardLayout: appPhase === 'idle'?]
    G -->|SÍ| H[startLoading → store.start → reset]
    H --> A
```

**Por qué `getCachedCount('products')` siempre es 0**: `processChunk` (DownloadQueueService.ts:348-369) retorna `corrupted: true` inmediatamente sin llamar a `commitChunk`. El store de productos en IDB queda vacío.

**Por qué el boot re-triggers**: DashboardLayout.tsx:100-104:
```typescript
useEffect(() => {
    if (isAuthReady && appPhase === 'idle') {
      startLoading();  // ← Siempre que phase = 'idle', sin check de availability
    }
}, [isAuthReady, appPhase, startLoading]);
```
Llama `startLoading()` → `store.start()` → resetea a `phase: 'quota'` → el ciclo se repite.

**Por qué el handler no detecta el error**: `useAppLoader.ts:231-233`:
```typescript
if (!result.ok && result.chunksFailed > 0) {
    appLogger.warn(...); // Solo log, no cambia estado
}
setPhase('categories'); // Siempre avanza, incluso con 0 ítems commited
```

### Referencia en task_plan.md

| Línea | Regla | Estado actual |
|-------|-------|--------------|
| 583 | `corrupted` → **No reintentar automático infinito** | ❌ Violado — el loop reintenta infinitamente |
| 665 | core entity sin core dataset → **Fatal → ErrorState** | ❌ Violado — nunca llega a ErrorState |
| 572 | Sin core dataset → error en core entity = **fatal de boot** | ❌ Violado — avanza como si nada |
| 567-570 | Clasificación por tipo de arranque (primer arranque vs cache) | ❌ No implementada en products handler |

---

## Soluciones Propuestas

### Principio Rector (de task_plan.md)
> `corrupted` → No reintentar automático infinito — enviar a `corruptionQueue` y `CorruptionRepairCenter`

### Lo que NO cambia
- Toast de corrupción: sigue apareciendo (correcto)
- `CorruptionRepairCenter`: sigue accesible desde toast y error screen
- `lastFailedPhase` + `handlePhaseError`: ya funcionan (Plan L implementado)
- `CacheProgressBar` con botones: ya funcionan (Plan L implementado)
- Botón "Cerrar sesión": ya visible (Plan L implementado)

---

### Solución A — Cortar el loop (mínimo, 2 cambios)

**Impacto**: La app no se queda en loop infinito, pero availability queda como `ready_partial` (seteado por stock phase) aunque products esté vacío. El usuario ve la app sin productos y un toast de corrupción.

#### A.1 — DashboardLayout.tsx:102 — No re-trigger si availability no es 'blocking'

**Archivo**: `frontend/src/presentation/shared/components/layout/DashboardLayout.tsx`

**Before**:
```typescript
if (isAuthReady && appPhase === 'idle') {
    startLoading();
}
```

**After**:
```typescript
if (isAuthReady && appPhase === 'idle' && appAvailability === 'blocking') {
    startLoading();
}
```

Esto rompe el loop porque después del primer boot, `availability` deja de ser `'blocking'` (stock phase la setea a `'ready_partial'`). `retryBoot()` manual sigue funcionando porque llama `store.start()` directo sin pasar por este trigger.

#### A.2 — useAppLoader.ts:231 — Detectar corrupción en products y setear degraded

**Archivo**: `frontend/src/presentation/shared/hooks/storage/useAppLoader.ts`

**Before**:
```typescript
if (!result.ok && result.chunksFailed > 0) {
    appLogger.warn('[AppLoader] products descarga parcial', result.errors);
}
setPhase('categories');
```

**After**:
```typescript
if (!result.ok) {
    const errMsg = result.errors?.[0] ?? 'Error desconocido descargando productos';
    appLogger.warn('[AppLoader] products descarga parcial', result.errors);
    setAvailability('degraded');
    setLastFailedPhase({ entityType: 'products', phaseLabel: 'productos', error: errMsg });
}
setPhase('categories');
```

**⚠️ Problema con esta solución**: El stock phase handler (línea 327) llama `setAvailability('ready_partial')` incondicionalmente, pisando el `'degraded'` que acabamos de setear. Para evitarlo, necesitamos:

#### A.3 — useAppLoader.ts:327 — No sobreescribir 'degraded' en stock phase

**Before**:
```typescript
setAvailability('ready_partial');
```

**After**:
```typescript
const currentAvail = useAppLoaderStore.getState().availability;
if (currentAvail !== 'degraded') {
    setAvailability('ready_partial');
}
```

**Verificación**: `start()` resetea availability a `'blocking'`, así que en el primer boot normal esto no afecta — solo cuando ya hay un degraded previo.

---

### Solución B — ErrorState para core corrupto (completa, 3 cambios + UX correcta)

**Impacto**: Cuando products (core entity) falla sin core dataset, se muestra ErrorState (según task_plan.md línea 665). El usuario ve "Error descargando productos" con botones Reintentar / Reparar / Cerrar sesión. Availability correcta.

#### B.1 — DashboardLayout.tsx:102 — Mismo que A.1 (indispensable)

#### B.2 — useAppLoader.ts:231 — Llamar handlePhaseError en lugar de solo log

**Before**:
```typescript
if (!result.ok && result.chunksFailed > 0) {
    appLogger.warn('[AppLoader] products descarga parcial', result.errors);
}
setPhase('categories');
```

**After**:
```typescript
if (!result.ok) {
    const errMsg = result.errors?.[0] ?? 'Error desconocido descargando productos';
    appLogger.warn('[AppLoader] products descarga parcial', result.errors);
    await handlePhaseError('products', new Error(errMsg), 'productos');
    return; // ← handlePhaseError ya setea phase/availability; no avanzar
}
setPhase('categories');
```

`handlePhaseError` para 'products' (core entity) en primer arranque (warehouses=unknown, products=0, stock=0 → `hasCore=false`):
- Llama `setLastFailedPhase({ entityType: 'products', ... })`
- Llama `setError(errMsg)` → `phase: 'error', availability: 'error'`
- → **ErrorState** con "Reintentar descarga", "Reparar datos corruptos", "Cerrar sesión"

Esto está alineado con task_plan.md línea 665: error en `warehouses/products/stock` **sin core** → Fatal → ErrorState.

#### B.3 — useAppLoader.ts:327 — No sobreescribir 'error' en stock phase (safety net)

Mismo cambio que A.3. Aunque con B.2 el phase es 'error' (stock effect no se ejecuta), este cambio previene futuros casos donde un error temprano sea pisado.

---

### Comparación

| Aspecto | Solución A (mínima) | Solución B (completa) |
|---------|--------------------|-----------------------|
| Loops infinitos | ✅ Eliminado | ✅ Eliminado |
| Availability tras corrupción en primer arranque | `ready_partial` (incorrecto — products vacío) | `error` (alineado con task_plan.md) |
| UI que ve el usuario | App sin productos + toast de corrupción | ErrorState con "Error descargando productos" + botones |
| Alineación con task_plan.md línea 665 | ❌ Parcial (no muestra ErrorState) | ✅ Completa |
| Cantidad de cambios | 3 archivos, ~10 líneas | 3 archivos, ~15 líneas |
| Riesgo | Bajo — availability incorrecta pero app no crashea | Bajo — ErrorState es el comportamiento esperado |
| Después de "Omitir y continuar" | Funciona (skipAndContinue setea degraded + idle) | Funciona (skipAndContinue reemplaza error state) |

---

## Reglas de Ejecución

> ⚠️ Complementan task_plan.md. Son vinculantes para este plan.

- **🏛️ task_plan.md es canónico**: línea 583 (`corrupted` → No reintentar automático infinito) es ley. Cualquier subfase que la viole se descarta.
- **Una fase a la vez**: primero decidir Solución A vs B, luego implementar, verificar, preguntar.
- **Commit al final**: `git add . && git commit -m 'fix(ux): M-phase cortar loop corrupto'`
- **Verificación**: `pnpm exec tsc --noEmit` + `pnpm test:run`
- **UI**: Español. **Código**: Inglés.
- **Mobile-first**: Touch targets ≥44px (`min-h-11`) — ya cumplido por Plan L.
- **Frontend tests**: Vitest + RTL, patrón AAA.

---

## Progreso

| Fase | Nombre | Estado |
|------|--------|--------|
| **M** | Cortar loop infinito en descarga corrupta | ⏳ Pendiente |
| **M.1** | DashboardLayout — guard condition re-trigger | ⏳ Pendiente |
| **M.2** | useAppLoader — detectar corrupción en products | ⏳ Pendiente |
| **M.3** | useAppLoader — no pisar degraded/error en stock | ⏳ Pendiente |

---

## Matriz de verificación

| Check | M.1 | M.2 | M.3 |
|-------|-----|-----|-----|
| `pnpm tsc --noEmit` sin errores | ❌ | ❌ | ❌ |
| `pnpm test:run` pasa (219/219) | ❌ | ❌ | ❌ |
| Loop infinito eliminado (corrupción products) | ❌ | ❌ | ❌ |
| `retryBoot()` manual desde error screen funciona | ❌ | ❌ | ❌ |
| `skipAndContinue()` desde error screen funciona | ❌ | ❌ | ❌ |
| Stock phase no pisa availability que ya es 'degraded' o 'error' | ❌ | ❌ | ❌ |
| Toast de corrupción sigue apareciendo | ❌ | ❌ | ❌ |

---

