# Plan: Arreglar Carga Inicial Bloqueada + SSE/Proxy

> Created: 2026-06-15 | v1 — refactoriza el loader roto (se traba al 10%) + SSE ECONNRESET por proxy Next.js.
>
> ⚠️ **Extiende `task_plan.md`**: no lo reemplaza. Reglas, principios y convenciones de `task_plan.md` se aplican aquí. Fase L.

---

## Problema 1 — Loading trabado al 10% (`sw_precache`)

El flujo actual en `useAppLoader.ts` tiene 6 fases sin handler:

```
quota (2%) → sw_precache (10%) → [AQUÍ SE TRABA]
  ↓ no existe useEffect para sw_precache
db_open (15%)         ← sin handler
rehydrate_local (18%) ← sin handler
warehouses (25%)      ← sin handler
categories (43%)      ← sin handler
products (40%)        ← sin handler
  ↓
currencies (46%)      ← PRIMER handler real (existe)
exchange_rates → customer_debts → stock → customers → suppliers → idle
```

El único `useEffect` que arranca es el de `quota` (línea 92, verifica almacenamiento). Tras setear `sw_precache`, no hay ningún `useEffect` escuchando las fases intermedias. La app se queda en 10% para siempre.

### Bug adicional: peso de `products`

En `appLoaderStore.ts:70`:
```typescript
products: 40,   // ← DEBERÍA ser > 43 (categories)
categories: 43, // ← más alto que products
```

La barra de progreso retrocedería de 43% a 40% al pasar de `categories` a `products`.

### Principios violados

| Principio | Impacto |
|-----------|---------|
| **P1. Cero internet en runtime** | No impactado — no requiere internet |
| **P2. Dispositivo ligero** | La app nunca llega a `ready_partial`, el usuario no puede operar |
| **P3. Trabajo offline indefinido** | **Imposible alcanzarlo** si el boot nunca termina |
| **P4. Servidor apagable** | No impactado |
| **P5. Sync no destructivo** | No impactado |

---

## Problema 2 — SSE ECONNRESET en `/api/v1/notifications/stream`

Los logs muestran errores repetidos de proxy:
```
Failed to proxy http://localhost:8080/api/v1/notifications/stream Error: socket hang up
code: 'ECONNRESET'
```

### Causa raíz

**Causa 1 — Next.js rewrite proxy no maneja SSE**: `next.config.ts:19-23` mapea `/api/*` → `localhost:8080` sin configuración de streaming. Next.js (Node.js HTTP) cierra conexiones SSE ociosas tras periodos de inactividad.

**Causa 2 — Sin keep-alive en el backend**: `NotificationSseController.java` emite eventos solo cuando hay notificaciones. Sin heartbeats periódicos (`: keepalive\n\n`), el proxy intermedio asume conexión muerta.

### Principios violados

| Principio | Impacto |
|-----------|---------|
| P1–P5 | **Ninguno** — el error es no-fatal, solo ruido en consola. La notificación SSE deja de funcionar pero la app opera normal. El hook de SSE ya tiene retry cada 5s. |

**No bloquea la app**. Es un bug de ruido.

---

## Objetivos

| Meta | Indicador |
|------|-----------|
| Carga inicial completa sin trabas | `ready_partial` en < 5s con caché, < 30s sin caché |
| 6 handlers faltantes implementados | `useAppLoader.ts` tiene `useEffect` para cada fase de `sw_precache` a `products` |
| Pesos de progreso monotónicos | `PHASE_WEIGHTS` 100% creciente sin retrocesos |
| SSE sin ECONNRESET en proxy | Proxy Next.js configurado para streaming o SSE conecta directo a backend |
| Keep-alive en backend SSE | Heartbeat cada 30s mientras no haya eventos |

---

## Fases de Implementación

### Fase L.1 — Frontend: implementar 6 handlers faltantes en useAppLoader.ts

**Skills**: `senior-frontend`, `clean-code`

#### L.1.1 — Handler `sw_precache` → `db_open` (simplificado)

El hook `useSWPrecacheProgress.ts` existe pero es código muerto (nunca se importa). La fase `sw_precache` actualmente marca "Instalando aplicación" pero no hay precache real que esperar. Simplificar: avanzar inmediatamente a `db_open`.

```typescript
useEffect(() => {
  if (store.phase !== 'sw_precache') return;
  setPhase('db_open');
}, [store.phase, setPhase]);
```

**Futuro**: Cuando se implemente SW precache real, este handler escuchará `useSWPrecacheProgress` y avanzará solo cuando `done === true`.

#### L.1.2 — Handler `db_open` → `rehydrate_local`

Verificar que IDB abre correctamente. Si falla, error fatal (principio de auditoría crítica del `task_plan.md`).

```typescript
useEffect(() => {
  if (store.phase !== 'db_open') return;
  (async () => {
    try {
      const db = await getDB();
      if (!db) throw new Error('IDB no disponible');
    } catch (err) {
      setError('Error al abrir almacenamiento local');
      return;
    }
    setPhase('rehydrate_local');
  })();
}, [store.phase, setPhase, setError]);
```

#### L.1.3 — Handler `rehydrate_local` → `warehouses` o `idle`

Verificar si el core dataset (warehouses + products + stockBalances) ya existe en IDB. Si existe, pasar a `idle` (carga completada, background tasks). Si no, iniciar descarga completa desde `warehouses`.

```typescript
useEffect(() => {
  if (store.phase !== 'rehydrate_local') return;
  (async () => {
    try {
      const [wCount, pCount, sCount] = await Promise.all([
        getCachedCount('warehouses'),
        getCachedCount('products'),
        getCachedCount('stockBalances'),
      ]);
      if (wCount > 0 && pCount > 0 && sCount > 0) {
        // Core dataset exists — go straight to ready
        setAvailability('ready_partial');
        void startBackgroundTasks();
        setPhase('idle');
        return;
      }
    } catch {}
    // No cache — full download
    setPhase('warehouses');
  })();
}, [store.phase, setPhase, setAvailability, setSubStep, setError]);
```

#### L.1.4 — Handler `warehouses`

```typescript
useEffect(() => {
  if (store.phase !== 'warehouses') return;
  (async () => {
    try {
      setSubStep('Descargando bodegas...');
      await loadFlatCatalog({
        endpoint: '/api/v1/warehouses',
        idbStoreName: 'warehouses',
        schema: warehouseResponseSchema,
        entityLabel: 'bodegas',
      });
      setPhase('categories');
    } catch (err) {
      await handlePhaseError('warehouses', err, 'bodegas');
      setPhase('categories');
    }
  })();
}, [store.phase, setPhase, setSubStep, handlePhaseError]);
```

#### L.1.5 — Handler `categories`

```typescript
useEffect(() => {
  if (store.phase !== 'categories') return;
  (async () => {
    try {
      setSubStep('Descargando categorías...');
      await loadFlatCatalog({
        endpoint: '/api/v1/categories',
        idbStoreName: 'categories',
        schema: categoryResponseSchema,
        entityLabel: 'categorías',
      });
      setPhase('products');
    } catch (err) {
      await handlePhaseError('categories', err, 'categorías');
      setPhase('products');
    }
  })();
}, [store.phase, setPhase, setSubStep, handlePhaseError]);
```

#### L.1.6 — Handler `products`

Los productos usan descarga paginada (chunked) a través de `DownloadQueueService.fetchAllWithIntegrity`. El endpoint es `/api/v1/products/paginated`.

```typescript
useEffect(() => {
  if (store.phase !== 'products') return;
  (async () => {
    try {
      setSubStep('Descargando productos...');
      await loadFlatCatalog({
        endpoint: '/api/v1/products/paginated',
        idbStoreName: 'products',
        schema: productResponseSchema,
        entityLabel: 'productos',
      });
      setPhase('currencies');
    } catch (err) {
      await handlePhaseError('products', err, 'productos');
      setPhase('currencies');
    }
  })();
}, [store.phase, setPhase, setSubStep, handlePhaseError]);
```

> **Nota de consistencia**: `categories` avanza a `products`. Pero `categories` no es core según la política de suficiencia mínima del `task_plan.md` ("sin categorías los productos siguen siendo funcionales"). Sin embargo, es más simple descargar categories primero y products después ya que el orden está establecido en la store. Si categories falla, `handlePhaseError` lo trata como no-fatal cuando ya existe core dataset.

#### L.1.7 — Fix peso `products` en `appLoaderStore.ts`

Cambiar `products: 40` → `products: 45` (mayor que `categories: 43`, menor que `currencies: 46`).

```typescript
products: 45,
```

#### Archivos modificados en L.1

| Archivo | Cambio |
|---------|--------|
| `presentation/shared/hooks/storage/useAppLoader.ts` | +6 useEffects para sw_precache, db_open, rehydrate_local, warehouses, categories, products |
| `core/loading/appLoaderStore.ts` | products: 40 → 45 |

> ✅ **L.1 completo** — `187c1b2` (L.1.1–L.1.3, L.1.7) + `b396162` (L.1.4–L.1.6) — 6 handlers implementados, weight fix products 40→45.

> `warehouseResponseSchema`, `categoryResponseSchema`, `productResponseSchema` ya existen como imports disponibles. `getDB`, `getCachedCount`, `DownloadQueueService` ya están importados.

---

### Fase L.2 — Backend: SSE keep-alive heartbeat

**Skills**: `clean-code`, `layered-architecture`

#### L.2.1 — Agregar heartbeat en `NotificationSseController.java`

Actualmente el endpoint retorna `Flux<ServerSentEvent<NotificationDto>>` directamente desde `NotificationSinkPort.streamForUser(userId)`:

```java
@GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ServerSentEvent<NotificationDto>> stream() {
    // ... obtiene userId del token
    return notificationSink.streamForUser(userId);
}
```

Agregar un heartbeat cada 30s mientras el flujo está activo pero sin eventos:

```java
@GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<ServerSentEvent<NotificationDto>> stream() {
    var userId = getCurrentUserId();
    var keepAlive = Flux.interval(Duration.ofSeconds(30))
        .map(i -> ServerSentEvent.<NotificationDto>builder()
            .comment("keepalive")
            .build());
    return Flux.merge(
        notificationSink.streamForUser(userId),
        keepAlive
    );
}
```

`Flux.merge` combina eventos (prioridad a los reales). El heartbeat es un comentario SSE (`: keepalive\n\n`) que los proxies interpretan como actividad y no matan la conexión.

#### Archivos modificados en L.2

| Archivo | Cambio |
|---------|--------|
| `adapters/web/controller/notification/NotificationSseController.java` | + Flux.interval keepAlive cada 30s |

---

### Fase L.3 — Frontend: SSE bypass proxy o configuración

**Skills**: `senior-frontend`, `clean-code`

Hay 3 estrategias. Elegir una:

| Estrategia | Descripción | Esfuerzo | Riesgo |
|-----------|-------------|----------|--------|
| **A. Keep-alive + retry (recomendada)** | Backend envía heartbeat (L.2). Frontend mantiene retry 5s existente. No tocar proxy. | Bajo | Mínimo — el reconnect de 5s ya funciona |
| **B. Proxy SSE timeout** | Configurar Next.js rewrite para streaming con timeout largo | Medio | Next.js 16 puede no exponer opciones de proxy raw |
| **C. Conexión directa** | SSE conecta directo a `localhost:8080` en vez de pasar por proxy | Bajo | Problemas de CORS si backend no configura `Access-Control-Allow-Origin` |

#### L.3.1 — Estrategia A (elegida): validar que el retry del frontend funciona

Los hooks ya tienen reconexión automática:
- `useNotificationStream.ts` (módulo): reconecta tras 5s (líneas 99-112)
- `useNotificationStream.ts` (shared): reconecta tras 5s (líneas 104-152)

Validar que el retry no sea ruidoso (loggear solo 1 vez por reconexión, no cada error de proxy). Mejorar logging para distinguir "reconexión normal" de "error permanente".

Agregar supresión de logs repetitivos:
```typescript
// Solo loggear el primer ECONNRESET de cada racha, no repetir cada 5s
if (!lastLoggedConnectionError || Date.now() - lastLoggedConnectionError > 60000) {
  appLogger.warn('[SSE] Stream desconectado, reconectando en 5s...');
  lastLoggedConnectionError = Date.now();
}
```

#### Archivos modificados en L.3

| Archivo | Cambio |
|---------|--------|
| `presentation/modules/notifications/hooks/useNotificationStream.ts` | Supresión de logs ruidosos + appLogger |
| `presentation/shared/hooks/api/useNotificationStream.ts` | Supresión de logs ruidosos + appLogger |

---

## Reglas de Ejecución (adicionales a task_plan.md)

- **L.1 es la prioridad**: Sin esto la app no arranca. Hacer L.1 completo antes de tocar L.2/L.3.
- **L.2 + L.3 son secundarios**: El SSE no bloquea la app. Si hay tiempo, hacer L.2 (back-end, sencillo). L.3 es opcional si L.2 resuelve el síntoma.
- ✅ **L.2 completado** — `72fa172` (keep-alive heartbeat 30s). ⏭️ **L.3 saltado** — opcional, resuelto por L.2.
- **Los handlers de L.1 siguen el patrón exacto de los handlers existentes** (`currencies` a `suppliers`): `useEffect` con guard de fase, async, try/catch, handlePhaseError, setPhase siguiente.
- **No modificar `loadFlatCatalog`** — reutilizarlo tal como está.
- **No tocar `CacheProgressBar`** ni la UI de progreso — los pesos corregidos y los handlers nuevos harán que avance naturalmente.
- **Verificación**: `pnpm exec tsc --noEmit` y `pnpm lint` antes de commit.
- **Commit por fase**: L.1 completo → commit, L.2 → commit, L.3 → commit.

---

## Archivos Resumen

| Archivo | Cambio | Fase |
|---------|--------|:----:|
| `presentation/shared/hooks/storage/useAppLoader.ts` | +6 handlers para sw_precache → db_open → rehydrate_local → warehouses → categories → products | L.1 |
| `core/loading/appLoaderStore.ts` | `products: 40` → `45` | L.1 |
| `backend/.../NotificationSseController.java` | + Flux.interval keepAlive 30s | ✅ L.2 |
| `presentation/modules/notifications/hooks/useNotificationStream.ts` | Supresión logs ruidosos + appLogger | L.3 |
| `presentation/shared/hooks/api/useNotificationStream.ts` | Supresión logs ruidosos + appLogger | L.3 |

---

## Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| `loadFlatCatalog` no soporta paginación para productos | Products nunca se descargan | Verificar `DownloadQueueService.fetchAllWithIntegrity` — ya maneja paginado |
| `rehydrate_local` detecta core dataset pero datos están corruptos | `ready_partial` con datos inconsistentes | La auditoría de boot (crítica) debe correr antes de decidir. Si el chunk journal tiene `corrupted`, ir a descarga completa. |
| Multi-tab race condition en boot | Dos tabs descargan el mismo chunk | `navigator.locks.request('download-lock')` — ya implementado en `DownloadQueueService`? Verificar. |
| SSE keep-alive causa CPU innecesaria | Cada 30s emite un evento aunque nadie escuche | El `Flux.interval` es barato (no bloquea). Spring WebFlux lo maneja con reactor timer. |
