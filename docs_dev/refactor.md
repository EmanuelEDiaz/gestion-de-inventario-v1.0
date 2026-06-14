# Plan: Fix Error Handling UX — Romper el ciclo infinito de retry

> Created: 2026-06-12 | v5 — Refinements: disabled prop chain + lastFailedPhase + barrel exports
> - **K.9**: Nueva — CacheProgressBar colapsado por defecto (floating badge de %), click-outside-to-close, DashboardLayout renderiza sidebar+header+skeleton atrás durante `blocking`, navegación bloqueada via `disabled` prop chain (logout exceptuado)
> - **K.5**: `lastFailedPhase` guardado en store para mensajes específicos en DegradedBanner
> - **K.7**: DegradedBanner usa `lastFailedPhase` para mensaje específico de fase fallida
> - **K.9**: Barrel exports para `useClickOutside` y `SkeletonDashboard`
> - **K.2**: `degraded` ya no entra en pantalla de error — renderiza layout con `<DegradedBanner>`
> - **K.5**: Nota: fases secuenciales hacen innecesaria la memoización de `hasCoreDataset`
> - **K.6**: Agregada migración IndexedDB DB_VERSION 7→8 para `retryCount`
> - **K.7**: Rediseñado como DegradedBanner (los mensajes estructurados se consolidan en K.2)
> - **K.8**: Nota: eventos personalizados son el patrón correcto para frontera hexagonal
> - **retryCurrentPhase**: Simplificado a `start()` — fases con cache se saltan automáticamente
> - **DashboardLayout**: Arreglada condición de loading para que `ready_partial` y `degraded` rendericen la app
>
> ⚠️ **Este plan implementa lo ya especificado en `task_plan.md** (secciones Reanudación de Carga Interrumpida, Matriz de Respuesta por Error, Respuesta Visual por Fase/Error y Política de Feedback UI, Formato de Mensajes de Error UI, Contrato UI por AppAvailability). No introduce nuevas políticas — solo cierra el gap entre especificación y código.

---

## Objetivos

### Principio Rector
**El usuario siempre tiene control sobre la resolución de errores. Sin loops automáticos, sin opciones únicas que no resuelven.**

Basado en `task_plan.md`:

1. **ErrorState con acciones múltiples** — nunca un solo botón "Reintentar" que siempre falla. Tres acciones: "Reintentar descarga" (llama a `start()` — reinicia boot, fases con cache se saltan automáticamente), "Reparar datos corruptos" (abre `CorruptionRepairCenter`), "Omitir y continuar" (transiciona a `degraded` → app renderiza con banner). Cada acción mapea a una sección de `task_plan.md` (ver K.2).
2. **Retry manual, no automático infinito** — `corrupted` chunks van al `CorruptionRepairCenter`, no a loop (vs `task_plan.md` línea 583)
3. **CorruptionRepairCenter visible desde el error** — no huérfano (vs `task_plan.md` línea 685)
4. **Auditoría clasificada** — crítico vs diagnóstico, solo lo crítico bloquea boot (vs `task_plan.md` líneas 557-572)
5. **Límite de 3 retries + quarantine** — `corruption` errors se intentan máximo 3 veces, luego pasan a estado `quarantined` (vs `task_plan.md` línea 649)
6. **Mensajes estructurados** — cada error incluye: qué pasó, qué impacto, qué puede hacer el usuario, si hay retry automático (vs `task_plan.md` líneas 611-618)
7. **Mismos principios P1–P5** — offline-first, cero internet externo, dispositivo ligero

---

## Análisis de Gap: `task_plan.md` vs Implementación Actual

| Especificación en `task_plan.md` | Implementación actual | Gap |
|---|---|---|
| Reanudación de carga: `corrupted` → enviar a `corruptionQueue` y `CorruptionRepairCenter` (línea 583) | ✅ Se escribe `CorruptionEntry` a `corruptionQueue` | ✅ Hecho |
| `corrupted` → No reintentar automático infinito (línea 583) | ❌ `DashboardLayout` llama a `startLoading()` que re-ejecuta TODO el boot en loop | 🔴 **Ciclo infinito** |
| Chunk corrupto → `CorruptionRepairCenter` + Toast (línea 685) | ❌ `CorruptionRepairCenter` existe pero **nunca se renderiza** en el flujo de error | 🔴 **Componente huérfano** |
| ErrorState con acciones: "Reintentar", "Reconstruir almacenamiento", "Borrar datos" (línea 562) | ❌ Un solo botón "Reintentar" que no distingue tipo de error | 🔴 **Sin opciones** |
| Availability degradada: `degraded` para errores no fatales (línea 563) | ✅ `'degraded'` existe en type y label | ✅ Hecho (solo verificar switches) |
| `corruption` → retry sí, **3 intentos, luego quarantine** (línea 649) | ❌ `CorruptionRepairCenter.handleRetryDownload` retry sin límite | 🟡 **Sin límite de retries** |
| Cada error UI incluye: qué pasó, impacto, acción usuario, si hay retry (línea 611-618) | ❌ `appError` se muestra crudo sin estructura | 🟡 **Mensaje sin formato** |
| Toast + InlineAlert para errores recuperables (línea 680) | ❌ Solo toast en error de boot, sin enlace al RepairCenter | 🟡 **Sin dirección a reparación** |
| Badge nav para incidentes de sync (línea 684) | ✅ `SyncIncidentsView` existe con badge | ✅ Hecho |

---

## Resumen de Hallazgos

| # | Problema | Severidad | Artefacto de `task_plan.md` violado |
|---|---|---|---|
| K1 | Pantalla de error con un solo botón "Reintentar" que reinicia boot completo → loop si la causa no se resuelve sola | 🔴 Crítico | Reanudación de carga: `corrupted` → No reintentar automático infinito (línea 583) |
| K2 | `CorruptionRepairCenter` no es accesible desde la pantalla de error. El usuario no sabe que existe. | 🔴 Crítico | Chunk corrupto → `CorruptionRepairCenter` + Toast (línea 685) |
| K3 | No hay opción "Omitir y continuar" para errores no fatales. Cualquier error bloquea el boot. | 🔴 Alto | Auditoría clasificada: diagnóstica NO bloquea `ready_partial` (línea 557-563) |
| K4 | `CorruptionRepairCenter` permite retries infinitos. `task_plan.md` exige 3 intentos máx luego quarantine. | 🟡 Alto | Matriz de respuesta: `corruption` → retry 3 intentos, luego quarantine (línea 649) |
| K5 | El mensaje de error no sigue formato estructurado (qué pasó, impacto, acción, retry) | 🟡 Medio | Formato de mensajes de error UI (línea 611-618) |
| K6 | No hay badge/sidebar que notifique corrupción pendiente. El usuario no sabe que hay datos corruptos. | 🟡 Medio | Chunk corrupto → Toast + badge (línea 685) |
| K7 | `fetchAllWithIntegrity` escribe `CorruptionEntry` pero no hay flujo de toast que dirija al RepairCenter | 🟡 Medio | Toast dirige al RepairCenter (línea 685) |
| K8 | `availability` store tiene `degraded` pero `DashboardLayout` no lo maneja — renderiza loading/error, no la app con banner. | 🟡 Medio | Auditoría clasificada: diagnóstica degrada a `degraded` (línea 563) |

---

## Reglas de Ejecución

> ⚠️ Estas reglas complementan las de `task_plan.md`. Son vinculantes para este plan.

- **🏛️ Principios Rectores P1–P5 son ley suprema**: si una subfase los viola, se descarta.
- **Una fase a la vez**: ejecutar → verificar → preguntar al usuario si continuar
- **Commit por fase**: `git add . && git commit -m '<tipo>(<scope>): <mensaje>'`
- **Verificación obligatoria**: `pnpm build` (frontend) + `pnpm lint` + `pnpm test:run`
- **UI**: Español (labels, tooltips, errores). **Código**: Inglés
- **Arquitectura hexagonal frontend**: `core/` → `infrastructure/` → `presentation/` (core NO depende de React/HTTP)
- **Mobile-first**: Touch targets ≥44px (`min-h-11`)
- **Tooltips obligatorios**: Todo botón de acción debe tener `<TooltipHint>` de `@/presentation/shared/components/ui/tooltip`
- **Reutilización obligatoria**: Usar componentes existentes antes de crear nuevos
- **Sin `any`** sin justificación explícita
- **Import order**: external → core → infrastructure → presentation
- **Logging**: Usar `appLogger`, prohibido `console.*` en producción
- **Frontend tests**: Vitest + React Testing Library, patrón AAA, tests co-located (`*.test.ts`)
- **Convención nombres**: kebab-case para entities/utils, PascalCase para componentes/hooks/repos/ports, prefijo `I` para ports frontend, prefijo `use` para hooks
- **Next.js 16**: leer `node_modules/next/dist/docs/` antes de escribir código frontend. Heed deprecation notices.
- **Estilo de código**: sin comentarios en código salvo excepciones justificadas

---

## Fase K — Romper el ciclo infinito: ErrorScreen con acciones + CorruptionRepairCenter visible

> **Skills**: `senior-frontend`, `clean-code`
> **Problema**: La pantalla de error de boot ofrece un solo botón "Reintentar" que llama a `startLoading()`. Si la causa es checksum mismatch o datos corruptos, el retry siempre falla → loop infinito. El `CorruptionRepairCenter` (con reintentar/reparar/descartar) existe pero es inaccesible desde el error.
> **Objetivo**: Reemplazar el error screen con opciones significativas según el tipo de error. Surface el `CorruptionRepairCenter`. Agregar `availability: 'degraded'` para errores no fatales. Limitar retries de corrupción a 3. Mensajes estructurados según `task_plan.md`.
> **Benchmark**: Error de checksum mismatch → usuario ve opciones (Reintentar/Reparar/Descartar) en vez de loop infinito.
> **Funcionalidad conservada**: El error state existe. El usuario puede reintentar. El RepairCenter ya implementa todas las acciones.

### K.1 — Agregar `'degraded'` a `AppAvailability` type

**Por qué**: `task_plan.md` línea 563 define que errores **diagnósticos** (no fatales) degradan `availability` a `degraded` sin bloquear boot. Sin este estado, no hay forma de distinguir "app funciona con limitaciones" de "app rota".

**Archivo**: `frontend/src/core/loading/appLoaderStore.ts`

`'degraded'` ya existe en el tipo. **No hay cambios**. Solo verificar que todos los `switch`/`if` sobre `availability` lo manejen.

**Verificación**: `tsc --noEmit` sin errores. Todos los places que switchean sobre `availability` manejan `degraded`.

---

### K.2 — Error screen con opciones según tipo de error (solo `availability === 'error'`)

**Por qué**: `task_plan.md` línea 562 especifica `ErrorState` con acciones múltiples para errores críticos recuperables. Sin embargo, el **usuario pidió** que las acciones sean específicamente: "Reintentar descarga", "Reparar datos corruptos" y "Omitir y continuar". Estas acciones cubren un espectro más amplio que las de `task_plan.md` línea 562 porque también aplican a errores diagnósticos.

> ⚠️ **Cambio clave respecto a v2**: `degraded` ya NO entra en esta pantalla. `availability === 'degraded'` renderiza el layout normal con `<DegradedBanner>` (ver K.7). Esta pantalla solo se ve para `availability === 'error'`.

**Mapeo de cada acción a `task_plan.md`**:

| Acción | Escenario en `task_plan.md` | Sección |
|---|---|---|
| "Reintentar descarga" | Error de descarga en fase de boot — llama a `start()` (reinicia boot completo; fases con datos cacheados se saltan automáticamente gracias a guardas `getCachedCount > 0`). `task_plan.md` línea 665: "Error descargando {entidad}" + botón reintentar | Respuesta Visual por Fase/Error |
| "Reparar datos corruptos" | Chunk corrupto → abre `CorruptionRepairCenter`. `task_plan.md` línea 685: "Chunk corrupto → CorruptionRepairCenter + Toast warning" | Política de Feedback UI |
| "Omitir y continuar" | Error en entidad crítica sin core dataset → usuario decide seguir con datos parciales, se transiciona a `degraded`. `task_plan.md` línea 563: Auditoría diagnóstica NO bloquea `ready_partial` | Auditoría Crítica vs Diagnóstica |

**Archivo**: `frontend/src/presentation/shared/components/layout/DashboardLayout.tsx`

**Before** (líneas 150-180):
```typescript
if (isAppError) {
  const isTokenError = appError ? /sesión|token|expirada|expir/i.test(appError) : false;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <CacheProgressBar />
        <div className="mt-4 flex flex-col gap-2">
          {isTokenError ? (
            <button
              onClick={() => { logout(); window.location.href = '/login'; }}
              className="rounded bg-red-600 px-4 py-2 text-xs text-white hover:bg-red-700"
            >
              Desconectarse
            </button>
          ) : (
            <button
              onClick={() => startLoading()}
              className="rounded bg-blue-600 px-4 py-2 text-xs text-white hover:bg-blue-700"
            >
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

**After**: Error screen con mensaje estructurado (formato `task_plan.md` línea 611-618) + 3 acciones + tooltips. Solo para `availability === 'error'`:

```typescript
import { CorruptionRepairCenter } from '@/presentation/shared/components/data-repair';
import { formatPhaseError } from '@/core/loading/appLoaderStore';  // o useAppLoader.ts

// En el componente:
const [showRepairCenter, setShowRepairCenter] = useState(false);
// ...

if (availability === 'error') {
  const isTokenError = appError ? /sesión|token|expirada|expir/i.test(appError) : false;

  // Mensaje estructurado task_plan.md línea 611-618
  const errorParts = formatPhaseError(store.phase, getPhaseLabel(store.phase), false, true);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
          {isTokenError ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900">Sesión expirada</h2>
              <p className="mt-2 text-sm text-red-600">{appError}</p>
              <div className="mt-6">
                <button onClick={() => { logout(); window.location.href = '/login'; }}>
                  Iniciar sesión
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900">Error al cargar datos</h2>
              <p className="mt-2 text-sm text-red-600">{appError}</p>
              {/* task_plan.md línea 614-617: qué pasó, impacto, acción, retry */}
              <p className="mt-3 text-sm text-gray-700">{errorParts.whatHappened}</p>
              <p className="mt-1 text-xs text-gray-500">{errorParts.impact} {errorParts.autoRetry}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                <TooltipHint
                  title="Reintentar descarga"
                  description="Reinicia la carga desde cero. Las fases con datos ya descargados se saltan automáticamente."
                  variant="info"
                >
                  <button onClick={retryBoot} className="min-h-11">
                    Reintentar descarga
                  </button>
                </TooltipHint>
                <TooltipHint
                  title="Abrir centro de reparación"
                  description="Muestra los chunks corruptos con opciones: re-descargar, editar JSON manualmente, o descartar."
                  variant="info"
                >
                  <button onClick={() => setShowRepairCenter(true)} className="min-h-11">
                    Reparar datos corruptos
                  </button>
                </TooltipHint>
                <TooltipHint
                  title="Omitir y continuar con datos parciales"
                  description="La app se mostrará con los datos que ya están en caché. Puedes reintentar la descarga después desde el panel de estado."
                  variant="info"
                >
                  <button onClick={skipAndContinue} className="min-h-11">
                    Omitir y continuar
                  </button>
                </TooltipHint>
              </div>
            </>
          )}
        </div>

        {showRepairCenter && (
          <CorruptionRepairCenter onClose={() => setShowRepairCenter(false)} userId={userId} />
        )}
      </div>
    </div>
  );
}
```

**Helper `formatPhaseError`** (consolidado desde la antigua K.7):

Esta función produce el mensaje estructurado según `task_plan.md` línea 613-617. Colocar en `appLoaderStore.ts` (junto a `getPhaseLabel`):

```typescript
export interface ErrorMessageParts {
  whatHappened: string;      // qué pasó
  impact: string;            // qué impacto tiene
  userAction: string;        // qué puede hacer el usuario
  autoRetry: string;         // si habrá retry automático
}

export function formatPhaseError(
  entityType: string,
  phaseLabel: string,
  hasCore: boolean,
  isCore: boolean,
): ErrorMessageParts {
  if (hasCore) {
    return {
      whatHappened: `No se pudo descargar la actualización de ${phaseLabel}.`,
      impact: 'La app seguirá usando los datos guardados anteriormente.',
      userAction: 'Puedes reintentar la descarga, reparar datos corruptos, u omitir y continuar.',
      autoRetry: 'No hay reintento automático.',
    };
  }
  if (!isCore) {
    return {
      whatHappened: `No se pudo descargar ${phaseLabel}.`,
      impact: 'Este recurso es secundario — puedes continuar con el resto de la app.',
      userAction: 'Reintenta la descarga o continúa sin este recurso.',
      autoRetry: 'No hay reintento automático durante el boot.',
    };
  }
  return {
    whatHappened: `No se pudo descargar ${phaseLabel}.`,
    impact: 'Este es un dato esencial — la aplicación no puede iniciarse sin él.',
    userAction: 'Revisa la conexión al servidor y reintenta. Si el problema persiste, contacta al administrador.',
    autoRetry: 'No hay reintento automático.',
  };
}
```

**Definiciones de callbacks** (agregar dentro del componente `DashboardLayout`):

`retryBoot`, `skipAndContinue` y `userId` se derivan del store y auth:

```typescript
import { useAuthStore } from '@/presentation/shared/hooks/storage/useAuthStore';

// En DashboardLayout:
const store = useAppLoaderStore();
const { user } = useAuthStore();
const userId = user?.id ?? 'boot-loader';

const retryBoot = useCallback(() => {
  useAppLoaderStore.getState().start();
}, []);

const skipAndContinue = useCallback(() => {
  useAppLoaderStore.getState().setAvailability('degraded');
  useAppLoaderStore.getState().setPhase('idle');  // limpia estado inconsistente
}, []);
```

> ⚠️ `retryBoot` llama a `start()` (antes `retryCurrentPhase`): **simplificado** — reinicia el boot completo. Las fases con datos cacheados se saltan automáticamente gracias a las guardas `getCachedCount > 0` en cada fase. No hace falta implementar retry por fase individual.
> `skipAndContinue`: llama a `setAvailability('degraded')`. Esto provoca que el componente se re-renderice. Como `availability !== 'error'`, la pantalla de error desaparece y el layout normal se renderiza con un `<DegradedBanner>` (ver K.7). **Debe** también llamar a `setPhase('idle')` para evitar estado inconsistente.
> `formatPhaseError`: definido arriba, produce `{ whatHappened, impact, userAction, autoRetry }` según `task_plan.md` línea 613-617.
> `CorruptionRepairCenter` se renderiza inline cuando el usuario hace clic en "Reparar datos corruptos".
> Cada botón usa `<TooltipHint>` según regla de tooltips obligatorios.
> `userId` proviene de `useAuthStore().user.id` — mismo patrón que `HealthPanel.tsx` línea 7.

**Verificación**: Simular error de checksum → ver 3 botones con tooltips + RepairCenter funcional. Al hacer clic en "Omitir y continuar", la pantalla de error desaparece y se muestra el dashboard con banner degradado.

---

### K.3 — `CorruptionRepairCenter` ya no es huérfano: renderizado condicional

**Por qué**: `CorruptionRepairCenter` existe (`frontend/src/presentation/shared/components/data-repair/CorruptionRepairCenter.tsx`) pero nunca se renderiza desde el flujo de error. `task_plan.md` línea 685: "Chunk corrupto → CorruptionRepairCenter + Toast warning. Toast dirige al RepairCenter."

**Archivo**: `frontend/src/presentation/shared/components/layout/DashboardLayout.tsx`

Importar y agregar estado para renderizado condicional. `userId` se obtiene de `useAuthStore` (ver K.2):

```typescript
import { CorruptionRepairCenter } from '@/presentation/shared/components/data-repair';
import { useAuthStore } from '@/presentation/shared/hooks/storage/useAuthStore';
// ...
const [showRepairCenter, setShowRepairCenter] = useState(false);
const { user } = useAuthStore();
const userId = user?.id ?? 'boot-loader';
```

El `<CorruptionRepairCenter>` se renderiza dentro del bloque de error cuando `showRepairCenter === true`.

**Reutilización**: `showRepairCenter` y `userId` se comparten entre K.2 (error screen), K.7 (degraded banner) y K.8 (toast → custom event). Usar el mismo estado y ref — no duplicar.

**Verificación**: Tests de `DashboardLayout` pasan con el nuevo estado. `CorruptionRepairCenter.test.tsx` ya tiene cobertura.

---

### K.4 — Badge de datos corruptos en sidebar

**Por qué**: `task_plan.md` línea 685: "Badge nav para incidentes de sync". Si hay chunks corruptos pendientes, el usuario debe saberlo desde la navegación, no solo desde el toast.

**Archivo**: `frontend/src/presentation/shared/components/layout/SidebarIcons.tsx` (o donde se definan badges)

Agregar hook `useCorruptionCount` que cuenta entradas con `status === 'pending'` en `corruptionQueue`:

```typescript
function useCorruptionCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    (async () => {
      const db = await getDB();
      const all = await db.getAll('corruptionQueue');
      setCount(all.filter((e: CorruptionEntry) => e.status === 'pending').length);
    })();
  }, []);
  return count;
}
```

Renderizar badge numérico en el icono de repair/sync si `count > 0`. El badge debe ser pequeño, circular, rojo, posicionado en la esquina del icono.

**Verificación**: Badge visible con 1+ entradas de corrupción. Al descartar/reparar todas, badge desaparece.

> ⚠️ **Prioridad baja**: La corrupción de datos ocurre durante el boot (ventana acotada), no en tiempo real. El badge se actualiza al montar el sidebar y al cerrar el RepairCenter. Si el tiempo es limitado, esta subfase puede posponerse — no bloquea el fix del ciclo infinito.

---

### K.5 — Error classification: crítico vs diagnóstico (lógica exacta de `task_plan.md`)

**Por qué**: `task_plan.md` líneas 565-572 definen una matriz de 2×2 para decidir si un error es fatal o degradado. La lógica actual en `useAppLoader.ts` trata cualquier error en entidad crítica como fatal incluso si ya existe core dataset. Esto contradice `task_plan.md`.

**La matriz exacta de `task_plan.md`**:

| Escenario | Core dataset existe? | Error en entidad crítica | Error en recurso secundario |
|---|---|---|---|
| **Primer arranque** (sin cache) | No | **Fatal** — bloquea boot (`error`) | Non-fatal — degrada a `degraded` |
| **Arranque con cache** (rehydrate_local) | Sí | Non-fatal → `ready_partial`/`degraded` | Non-fatal — solo degrada |

**Lógica implementada**: Cuando ocurre un error en cualquier fase de descarga, se pregunta:
1. ¿Core dataset existe en IDB (warehouses + products + stockBalances)?
   - **Sí** → cualquier error es **non-fatal**: `setAvailability('degraded')`. El core dataset ya está disponible, la app puede funcionar con datos parciales.
   - **No** → depende de la entidad:
     - Entidad **crítica** (warehouses, products, stockBalances) → **fatal**: `setError(errMsg)`. Sin estos datos la app no puede funcionar.
     - Entidad **secundaria** (customers, suppliers, rates, debts, categories) → **non-fatal**: `setAvailability('degraded')`. Son datos complementarios.

> ⚠️ **No memoizar `hasCoreDataset`**: Las fases son estrictamente secuenciales (un `useEffect` por fase, controlado por `store.phase`). El primer error termina la secuencia — `hasCoreDataset` se llamaría como máximo 1 vez. IndexedDB query es ~1-5ms. Memoización añadiría complejidad innecesaria para beneficio nulo.
>
> **Reutilizar lógica existente**: `hasCoreDataset` (warehouseCount > 0 && productCount > 0 && stockCount > 0) es idéntica a la verificación de cache mínimo en `rehydrate_local` (useAppLoader.ts líneas 144-145). Refactorizar: crear función compartida `checkCoreDataset()` en `core/loading/` y usarla desde ambos lugares.

**Archivo**: `frontend/src/presentation/shared/hooks/storage/useAppLoader.ts`

Modificar cada `catch` en los `useEffect` de fases de descarga para usar `handlePhaseError`:

```typescript
// task_plan.md línea 572: Si aún no existe core dataset suficiente, errores en entidades críticas son fatales de boot.
// task_plan.md línea 570: Si existe core dataset, cualquier error es non-fatal y solo degrada.
const CORE_ENTITIES = new Set(['warehouses', 'products', 'stock']);

async function hasCoreDataset(): Promise<boolean> {
  const [wCount, pCount, sCount] = await Promise.all([
    getCachedCount('warehouses'),
    getCachedCount('products'),
    getCachedCount('stockBalances'),
  ]);
  return wCount > 0 && pCount > 0 && sCount > 0;
}

function isCoreEntity(entityType: string): boolean {
  return CORE_ENTITIES.has(entityType);
}

async function handlePhaseError(
  entityType: string,
  err: unknown,
  phaseLabel: string,
): Promise<void> {
  const errMsg = err instanceof Error ? err.message : `Error al descargar ${phaseLabel}`;
  const hasCore = await hasCoreDataset();

  if (hasCore) {
    // Arranque con cache: cualquier error es non-fatal, solo degrada
    setAvailability('degraded');
    setLastFailedPhase({ entityType, phaseLabel, error: errMsg });
    appLogger.warn(`[AppLoader] ${entityType} non-fatal — usando datos anteriores`, err);
  } else if (!isCoreEntity(entityType)) {
    // Primer arranque: error en recurso secundario → degradado
    setAvailability('degraded');
    setLastFailedPhase({ entityType, phaseLabel, error: errMsg });
    appLogger.warn(`[AppLoader] ${entityType} non-fatal — recurso secundario`, err);
  } else {
    // Primer arranque: error en entidad crítica → fatal
    setError(errMsg);
  }
}
```

Luego, cada `catch` en `useEffect` de fases se reemplaza de:
```typescript
catch (err) {
  setError(err instanceof Error ? err.message : 'Error...');
}
```
a:
```typescript
catch (err) {
  await handlePhaseError('warehouses', err, 'bodegas');
}
```

**Fases que se modifican**: `warehouses`, `products`, `categories`, `currencies`, `exchange_rates`, `customer_debts`, `stock`, `customers`, `suppliers`.

**Nota**: Las fases `currencies`, `exchange_rates`, `customer_debts` actualmente ya tienen manejo non-fatal con `appLogger.warn` + `setPhase(...)`. Esas mantienen su lógica actual porque específicamente no bloquean y continuan a la siguiente fase — no necesitan `handlePhaseError`.

**Agregar `lastFailedPhase` al store**: En `appLoaderStore.ts`, agregar tipo y acción para que K.7 (DegradedBanner) muestre mensaje específico:

```typescript
// En appLoaderStore.ts — junto al resto de tipos de estado
export interface FailedPhase {
  entityType: string;
  phaseLabel: string;
  error: string;
}

// En la interfaz AppLoaderState:
lastFailedPhase: FailedPhase | null;

// En las acciones:
setLastFailedPhase: (phase: FailedPhase | null) => void;
```

> `lastFailedPhase` se setea en `handlePhaseError` (arriba) y se consume en K.7 (DegradedBanner). Se resetea al iniciar `start()`.

**Verificación**:
- Boot sin cache + error en `warehouses` → `availability = 'error'` (fatal)
- Boot sin cache + error en `customers` → `availability = 'degraded'` (non-fatal)
- Boot con cache existente + error en `warehouses` → `availability = 'degraded'` (non-fatal, hay core dataset)
- Boot con cache existente + error en `customers` → `availability = 'degraded'` (non-fatal)

---

### K.6 — Límite de 3 retries para `corruption` entries

**Por qué**: `task_plan.md` Matriz línea 649: `corruption` → retry sí (3 intentos, luego quarantine). Actualmente `CorruptionRepairCenter.handleRetryDownload` no tiene límite, permitiendo reintentos infinitos.

**Archivos**:
- `frontend/src/core/loading/types/corruption.ts` — agregar `retryCount` al tipo `CorruptionEntry`
- `frontend/src/presentation/shared/components/data-repair/CorruptionRepairCenter.tsx` — limitar retry a 3, agregar estado `quarantined`

**Paso 0 — Migración IndexedDB: DB_VERSION 7→8**:

En `frontend/src/infrastructure/storage/db.ts`:
1. Bump `DB_VERSION` de `7` a `8`
2. Agregar upgrade handler que añada `retryCount: 0` a entradas existentes sin el campo:

```typescript
// En el upgrade handler, después del bloque v5→v6 existente:
if (oldVersion < 8) {
  const cqStore = transaction.objectStore('corruptionQueue');
  const all = await cqStore.getAll();
  for (const entry of all) {
    if (entry.retryCount === undefined) {
      cqStore.put({ ...entry, retryCount: 0 });
    }
  }
}
```

> ⚠️ Usar `transaction.objectStore()` en lugar de `db.transaction()` porque el upgrade callback ya tiene una transacción activa. Usar `db.transaction()` dentro de `upgrade` crearía una transacción anidada que no es válida en IndexedDB.

> ⚠️ `task_plan.md` (sección "Migración IndexedDB multi-tab"): Si otra pestaña mantiene la DB abierta, el upgrade se blocca. Manejar evento `blocked` con banner "Se requiere recargar otras pestañas" (ya existe la estructura de upgrade — solo añadir el handler).

**Paso 1 — Agregar `retryCount` al tipo `CorruptionEntry`**:

También actualizar `CorruptionStatus` en `frontend/src/core/loading/types/corruption.ts`:

```typescript
export type CorruptionStatus = 'pending' | 'repaired' | 'discarded' | 'quarantined';
//                                                        ↑ NUEVO: cuando retryCount >= 3

export interface CorruptionEntry {
  id?: number;
  entityType: string;
  chunkKey: string;
  parseError: string;
  rawPayload: string;
  status: CorruptionStatus;
  retryCount: number;     // ← NUEVO: contador de reintentos, max 3
  repairedPayload?: string;
  receivedAt: number;
  repairedAt?: number;
}
```

**Paso 2 — Limitar `handleRetryDownload` a 3 intentos**:

En `CorruptionRepairCenter.tsx`, modificar `handleRetryDownload`:

```typescript
const MAX_RETRIES = 3;

const handleRetryDownload = useCallback(async () => {
  if ((entry.retryCount ?? 0) >= MAX_RETRIES) {
    // Marcar como quarantined, no más reintentos
    const db = await getDB();
    const updated: CorruptionEntry = {
      ...entry,
      status: 'quarantined',
      retryCount: (entry.retryCount ?? 0),
      repairedAt: Date.now(),
    };
    await db.put('corruptionQueue', updated);
    setRetryMessage('Límite de reintentos alcanzado. Dato en cuarentena.');
    onStatusChange();
    return;
  }

  setBusyAction('retry');
  setRetryMessage(null);
  try {
    const result = await DownloadQueueService.fetchAllWithIntegrity(
      `/api/v1/${entry.entityType}`,
      entry.entityType,
      (() => ({ safeParse: (v: unknown) => ({ success: true, data: v }) })) as any,
      { userId: REPAIR_DEFAULT_USER_ID },
    );
    // Incrementar retryCount y actualizar estado
    const db = await getDB();
    const newRetryCount = (entry.retryCount ?? 0) + 1;
    const updated: CorruptionEntry = {
      ...entry,
      retryCount: newRetryCount,
      status: result.ok ? 'repaired' : 'pending',
      repairedAt: Date.now(),
    };
    await db.put('corruptionQueue', updated);
    setRetryMessage(
      result.ok
        ? 'Re-descargado correctamente'
        : `Reintento ${newRetryCount}/${MAX_RETRIES} completado con ${result.errors.length} error(es)`,
    );
    onStatusChange();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const newRetryCount = (entry.retryCount ?? 0) + 1;
    const db = await getDB();
    const updated: CorruptionEntry = {
      ...entry,
      retryCount: newRetryCount,
      status: newRetryCount >= MAX_RETRIES ? 'quarantined' : 'pending',
      repairedAt: Date.now(),
    };
    await db.put('corruptionQueue', updated);
    setRetryMessage(
      newRetryCount >= MAX_RETRIES
        ? `Reintento ${newRetryCount}/${MAX_RETRIES} falló. Dato en cuarentena.`
        : `Reintento ${newRetryCount}/${MAX_RETRIES} falló: ${msg}`,
    );
    appLogger.error('[CorruptionRepairCenter] retry download failed', err, {
      errorCode: 'ERR_NETWORK',
      entryId: entry.id,
      entityType: entry.entityType,
    });
  } finally {
    setBusyAction(null);
  }
}, [entry, onStatusChange]);
```

**Paso 3 — Mostrar estado `quarantined` en UI**:

En `CorruptionRow`, si `entry.status === 'quarantined'`, deshabilitar botones de retry/reparar y mostrar mensaje:

```typescript
{entry.status === 'quarantined' && (
  <p className="mt-1 text-xs text-amber-600">
    En cuarentena — límite de reintentos alcanzado. Puedes descartar o editar manualmente.
  </p>
)}
```

**Verificación**:
- Chunk corrupto + retry 3 veces → status = `quarantined`, botón de reintentar deshabilitado o muestra "En cuarentena"
- Test que verifica que al cuarto retry se marca `quarantined`
- Test que `retryCount` se incrementa correctamente

---

### K.7 — Degraded state: DashboardLayout renderiza con banner degradado

**Por qué**: Cuando `availability === 'degraded'`, la app debe mostrar el layout principal (dashboard) con un banner de estado degradado, **no** una pantalla de error. `task_plan.md` línea 563: auditoría diagnóstica solo degrada, no bloquea. Línea 703: `ready_partial` y `degraded` = layout principal visible.

**Esto requiere dos cambios** (ambos modifican `DashboardLayout.tsx` — integrar con K.9):

#### Cambio 1 — Arreglar condición de loading en `DashboardLayout`

**Archivo**: `frontend/src/presentation/shared/components/layout/DashboardLayout.tsx`

**Before** (líneas 39-41):
```typescript
const isAppComplete = appAvailability === 'ready_complete';
const isAppError = appAvailability === 'error';
```

**After** (alineado con K.9):
```typescript
const isAppError = appAvailability === 'error';
const isBlocking = appAvailability === 'blocking';
const isAppReady = appAvailability === 'ready_partial'
  || appAvailability === 'ready_complete'
  || appAvailability === 'degraded';
```

Y cambiar la condición de loading:
```typescript
// Before:
if (!isAppComplete && !isAppError) { ... loading overlay ... }

// After:
// Nota: las condiciones se evalúan en orden de precedencia:

// 1. Error → siempre pantalla de error
if (isAppError) { return <ErrorScreen />; }

// 2. Blocking → layout + skeleton + blocker (K.9)
if (isBlocking) { return <LoadingLayout />; }

// 3. Ready → layout normal (puede tener DegradedBanner si degraded)
// ... layout normal ...
```

> ⚠️ `ready_complete` nunca se setea (es "derived, not set" según `task_plan.md` línea 4). Pero se incluye en `isAppReady` por completitud — si algún día se setea, no hay que tocar esta condición.
>
> ⚠️ **Integración K.7 + K.9**: K.7 agrega el `DegradedBanner` en el layout renderizado. K.9 reemplaza el bloque `if (!isAppComplete && !isAppError)` por `if (isBlocking)`. Ambas fases tocan el mismo archivo. La implementación debe producir un único `DashboardLayout.tsx` con: primero error, segundo blocking (layout+skeleton+CacheProgressBar), tercero ready (layout normal + DegradedBanner condicional).

#### Cambio 2 — Agregar `<DegradedBanner>` en el layout renderizado

**Archivo**: `frontend/src/presentation/shared/components/layout/DashboardLayout.tsx`

En el `return` del dashboard (la última rama), agregar banner condicional. Usar `lastFailedPhase` (definido en K.5) para mensaje específico:

```typescript
// Dashboard layout — renderizado cuando availability no es 'blocking' ni 'error'
const lastFailedPhase = useAppLoaderStore((s) => s.lastFailedPhase);

return (
  <div className="min-h-screen bg-gray-50">
    {availability === 'degraded' && lastFailedPhase && (
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900">
              Carga parcial — algunos datos no están disponibles
            </p>
            <p className="mt-1 text-xs text-amber-700">
              No se pudo descargar {lastFailedPhase.phaseLabel}. La app usará datos anteriores.
              Puedes reintentar o reparar datos corruptos.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <TooltipHint
              title="Reintentar descarga"
              description="Reinicia la carga. Las fases con datos ya descargados se saltan automáticamente."
              variant="info"
            >
              <button onClick={retryBoot} className="min-h-11 rounded bg-amber-600 px-3 py-1.5 text-xs text-white hover:bg-amber-700">
                Reintentar
              </button>
            </TooltipHint>
            <TooltipHint
              title="Abrir centro de reparación"
              description="Muestra los chunks corruptos con opciones de reparación."
              variant="info"
            >
              <button onClick={() => setShowRepairCenter(true)} className="min-h-11 rounded bg-white px-3 py-1.5 text-xs text-amber-800 ring-1 ring-amber-300 hover:bg-amber-100">
                Reparar
              </button>
            </TooltipHint>
          </div>
        </div>
        {showRepairCenter && (
          <CorruptionRepairCenter onClose={() => setShowRepairCenter(false)} userId={userId} />
        )}
      </div>
    )}

    {availability === 'ready_partial' && (
      <div className="border-b border-blue-200 bg-blue-50 px-4 py-2">
        <p className="text-xs text-blue-700">
          Descargando recursos secundarios...
        </p>
      </div>
    )}

    <DashboardHeader disabled={isBlocking} ... />
    <DashboardMain isCollapsed={isCollapsed}>{children}</DashboardMain>
    ...
  </div>
);
```

**Notas**:
- `retryBoot` es la misma función que en K.2 (llama a `start()`).
- El banner degradado es persistente (no auto-dismiss) — el usuario debe resolver o aceptar el estado.
- El banner de `ready_partial` es informativo (auto-dismiss cuando fase llega a `idle`).
- `CorruptionRepairCenter` se renderiza inline como en K.2, reutilizando el mismo estado `showRepairCenter`.

**Verificación**:
- `availability === 'degraded'` → se renderiza dashboard con banner ámbar (no pantalla de error)
- `availability === 'ready_partial'` → se renderiza dashboard con banner azul informativo (no loading screen)
- `availability === 'error'` → se renderiza pantalla de error (sin cambios funcionales)
- Click en "Reintentar" del banner → `start()`, el estado vuelve a `blocking`, aparece loading screen
- Click en "Reparar" del banner → se abre `CorruptionRepairCenter`

---

### K.8 — Toast que dirige al RepairCenter cuando se escribe `CorruptionEntry`

**Por qué**: `task_plan.md` línea 685: "Toast warning. Toast dirige al RepairCenter." Actualmente `fetchAllWithIntegrity` escribe `CorruptionEntry` pero no hay toast.

**Archivos**:
- `frontend/src/infrastructure/storage/DownloadQueueService.ts` — método `fetchAllWithIntegrity`: cuando detecta checksum mismatch, dispara custom event `corruption-detected` con detalle del chunk
- `frontend/src/presentation/shared/components/layout/DashboardLayout.tsx` — listener del evento que muestra el toast y abre RepairCenter

**En `DownloadQueueService.ts`**:

Cuando se detecta checksum mismatch y se escribe `CorruptionEntry`, disparar evento personalizado (NO importar toast desde infrastructure — violaría hexágono):

```typescript
// Dentro de fetchAllWithIntegrity, cuando serverChecksum !== clientChecksum:
// No importar toast aquí — infrastructure no depende de presentation
window.dispatchEvent(new CustomEvent('corruption-detected', {
  detail: { idbStoreName, chunkKey },
}));
```

**En `DashboardLayout.tsx`** (presentation), agregar listener que muestra el toast y abre RepairCenter:

```typescript
import { toast } from '@/presentation/shared/components/ui';

useEffect(() => {
  const handler = (e: Event) => {
    const { idbStoreName } = (e as CustomEvent).detail;
    toast.warning('Datos corruptos detectados', {
      description: `${idbStoreName}: el checksum del chunk no coincide. Los datos se guardaron en el centro de reparación.`,
      action: 'Ir a reparar',
      onAction: () => setShowRepairCenter(true),
      duration: 120_000, // 2 minutos
    });
  };
  window.addEventListener('corruption-detected', handler);
  return () => window.removeEventListener('corruption-detected', handler);
}, []);
```

También mantener el listener de `open-repair-center` (para que otros contextos puedan abrir el RepairCenter):

```typescript
useEffect(() => {
  const handler = () => setShowRepairCenter(true);
  window.addEventListener('open-repair-center', handler);
  return () => window.removeEventListener('open-repair-center', handler);
}, []);
```

> ⚠️ **Eventos personalizados vs estado global**: Usar `window.dispatchEvent` es el patrón correcto aquí. `DownloadQueueService` está en `infrastructure/` y no puede importar `appLoaderStore` (core) sin violar la arquitectura hexagonal. Los custom events son el mecanismo adecuado para cruzar esta frontera. No reemplazar por estado global.

**Verificación**: Test que checksum mismatch produce toast. Test que toast tiene action button "Ir a reparar". Test que al hacer clic en "Ir a reparar" se abre `CorruptionRepairCenter`.

---

### K.9 — Loading UX: skeleton dashboard + CacheProgressBar colapsable + bloqueador navegación

**Por qué**: `task_plan.md` línea 702 define que `blocking` muestra "Fullscreen loader con barra de progreso + fase actual + sub-paso" ocultando todo el contenido. El usuario solicita que durante `blocking` se vea la estructura del layout (sidebar + header + skeleton del contenido) atrás, con un indicador de progreso colapsable y navegación bloqueada.

**Resumen de decisiones**:
1. **Badge colapsado**: Muestra `"Cargando… xx%"` con tooltip de fase actual al hover. Click expande al panel completo de progreso.
2. **Navegación bloqueada**: Prop `disabled` se propaga por cadena `Sidebar` → `SidebarSection` → `SidebarNavItem` (cursor-not-allowed + preventDefault). Sin overlays ni z-index. El skeleton del main no requiere bloqueador — no es interactivo por naturaleza.
3. **Logout**: Siempre disponible — está en `DashboardHeader` fuera de la cadena `disabled` del sidebar.

**Archivos a modificar/crear**:

| Archivo | Acción |
|---|---|
| `frontend/src/presentation/shared/hooks/ui/useClickOutside.ts` | **Crear** — hook genérico click-outside |
| `frontend/src/presentation/shared/components/network-status/CacheProgressBar.tsx` | **Modificar** — añadir `variant: 'floating'`, collapsed por defecto, click-outside-to-close |
| `frontend/src/presentation/shared/components/layout/DashboardLayout.tsx` | **Modificar** — renderizar layout completo + skeleton + blocker durante `blocking` |
| `frontend/src/presentation/shared/components/layout/SkeletonDashboard.tsx` | **Crear** — esqueleto visual con `animate-pulse` |

**Paso 1 — Crear `useClickOutside` hook** (exportar en barrel `hooks/ui/index.ts`):

```typescript
// frontend/src/presentation/shared/hooks/ui/useClickOutside.ts

'use client';

import { useEffect, useRef, type RefObject } from 'react';

export function useClickOutside<T extends HTMLElement>(
  handler: () => void,
): RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handler();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [handler]);

  return ref;
}
```

**Paso 2 — Refactor `CacheProgressBar` con variante `floating`**:

Agregar prop `variant: 'inline' | 'floating'`:
- `inline`: comportamiento actual (sin cambios) — para usar dentro del layout normal o en error screen
- `floating`: collapsed por defecto como badge fixed en esquina superior derecha, expande a panel completo, click outside o clic en ✕ colapsa

Estructura del floating:

```typescript
interface CacheProgressBarProps {
  variant?: 'inline' | 'floating';
}

export function CacheProgressBar({ variant = 'inline' }: CacheProgressBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const panelRef = useClickOutside<HTMLDivElement>(() => {
    if (variant === 'floating' && isExpanded) setIsExpanded(false);
  });

  // ... existing selectors ...

  if (variant === 'floating' && !isExpanded) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="min-h-11 flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-lg ring-1 ring-gray-200 hover:bg-gray-50 transition-all"
          title={`Cargando… ${deferredProgress}% — ${getPhaseLabel(phase)}`}
        >
          <Loader2 size={14} className="animate-spin text-blue-500" />
          <span className="text-xs font-medium text-gray-700">{deferredProgress}%</span>
        </button>
      </div>
    );
  }

  return (
    <div ref={panelRef} className={variant === 'floating'
      ? 'fixed top-4 right-4 z-50 w-80 rounded-lg bg-white p-4 shadow-xl ring-1 ring-gray-200'
      : 'space-y-2'
    }>
      {variant === 'floating' && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700">Carga de datos</span>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-gray-600 min-h-11 min-w-11 flex items-center justify-center"
            aria-label="Cerrar panel de carga"
          >
            ✕
          </button>
        </div>
      )}
      {/* ... existing progress bar content ... */}
    </div>
  );
}
```

**Paso 3 — Modificar `DashboardLayout` para renderizar layout + skeleton + navegación bloqueada via `disabled` prop**:

Reemplazar la rama loading actual (línea 138: `if (!isAppComplete && !isAppError)`) por un layout que renderiza sidebar+header+main con `disabled` propagado y SkeletonDashboard + CacheProgressBar floating:

```typescript
// DashboardLayout.tsx — después de los early returns (auth, etc.)

const isBlocking = appAvailability === 'blocking';
const isAppReady = appAvailability === 'ready_partial'
  || appAvailability === 'ready_complete'
  || appAvailability === 'degraded';
const isAppError = appAvailability === 'error';

if (isBlocking && !isAppError) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar con navegación deshabilitada via prop disabled */}
      <Sidebar disabled={true} isCollapsed={...}>
        <SidebarSection disabled={true} ... />
      </Sidebar>

      {/* Header: elementos no-logout deshabilitados. Logout siempre funcional. */}
      <DashboardHeader disabled={true} ... />

      <DashboardMain isCollapsed={...}>
        <SkeletonDashboard />
      </DashboardMain>

      {/* Mensaje informativo inferior */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <div className="rounded-full bg-gray-900/80 px-4 py-2 text-xs text-white shadow-lg">
          Cargando aplicación — la navegación estará disponible en unos segundos
        </div>
      </div>

      {/* Badge flotante de progreso */}
      <CacheProgressBar variant="floating" />
    </div>
  );
}
```

**Cadena de props `disabled`**: Agregar prop `disabled` a `Sidebar` que se propaga a `SidebarSection` → `SidebarNavItem`. Cuando `disabled === true`, los links de navegación muestran `cursor-not-allowed` y ejecutan `e.preventDefault()` en el click. El logout sigue funcionando porque está en `DashboardHeader`, fuera de la cadena del sidebar:

1. `SidebarNavItem` acepta `disabled?: boolean`. Si `true`, el `<Link>` usa `href="#"`, `onClick` previene navegación, y aplica `cursor-not-allowed opacity-50`.
2. `SidebarSection` pasa `disabled` a `SidebarNavItem`.
3. `Sidebar` acepta `disabled?: boolean` y lo pasa a `SidebarSection`.
4. `DashboardHeader`: si `disabled`, los elementos interactivos no-logout se deshabilitan visualmente. El botón de logout **no** se deshabilita.
5. `DashboardLayout` pasa `disabled={isBlocking}` a `<Sidebar>` y `<DashboardHeader>`.

```typescript
// SidebarNavItem.tsx — modificar interface y render
interface SidebarNavItemProps {
  item: NavItem;
  isCollapsed: boolean;
  disabled?: boolean;
}

export function SidebarNavItem({ item, isCollapsed, disabled }: SidebarNavItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <Link
      href={disabled ? '#' : item.href}
      onClick={disabled ? (e: React.MouseEvent) => e.preventDefault() : undefined}
      className={cn(
        'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors',
        isActive
          ? 'bg-blue-600 text-white'
          : 'text-gray-400 hover:bg-gray-800 hover:text-white',
        isCollapsed && 'justify-center px-2',
        disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent hover:text-gray-400',
      )}
    >
      {/* ... existing content ... */}
    </Link>
  );
}
```

**Paso 4 — Crear `SkeletonDashboard`** (exportar en barrel `components/layout/index.ts`. Reutilizar el componente base `<Skeleton>` existente en `data-display/Skeleton.tsx`):

```typescript
// frontend/src/presentation/shared/components/layout/SkeletonDashboard.tsx

'use client';

import { Skeleton } from '@/presentation/shared/components/data-display/Skeleton';

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 p-6">
      {/* Título */}
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-48" />

      {/* Cards de resumen */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>

      {/* Tabla skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
        <Skeleton className="h-10" />
      </div>
    </div>
  );
}
```

> ⚠️ El componente `<Skeleton>` ya existe en `data-display/Skeleton.tsx` con `animate-pulse rounded-md bg-gray-200 aria-hidden="true"`. Reutilizarlo en lugar de crear divs manuales con clases Tailwind. Si no está exportado en el barrel, importar directamente.

**Actualizar contrato de `blocking` en `task_plan.md`**:

Referencia `task_plan.md` línea 702: cambiar de:
> `| blocking | Fullscreen loader con barra de progreso + fase actual + sub-paso | CacheProgressBar ocupa pantalla completa. Todo el contenido detrás oculto. |`

a:
> `| blocking | Layout visible con skeleton + bloqueo navegación + indicador de progreso colapsable. La navegación (sidebar, header) no está disponible hasta completar carga. | DashboardLayout visible con sidebar + header + SkeletonDashboard en main. CacheProgressBar flotante colapsado en badge "Cargando xx%". Overlay bloqueador sobre sidebar+header (logout exceptuado). Mensaje informativo fijo inferior. |`

> ⚠️ **Compatibilidad con K.7**: K.7 introduce la condición `isAppReady` (reemplaza `isAppComplete`) y agrega `DegradedBanner`. K.9 extiende el renderizado de `blocking` para mostrar layout (con `disabled` propagado) + skeleton + colapsed progress. Ambas fases modifican `DashboardLayout.tsx`. La implementación debe combinar ambas: `isBlocking → layout con skeleton + disabled props`, `isAppReady → layout normal`, `isAppError → error screen`.

**Verificación**:
- Estado `blocking` → se renderiza layout con sidebar + header + skeleton + badge flotante de progreso
- Click en badge → se expande panel de progreso completo
- Click fuera del panel expandido → se colapsa
- Click ✕ en panel → se colapsa
- Sidebar y header links no navegan (cursor not-allowed)
- Botón "Cerrar sesión" funciona durante loading
- Al completar carga → badge desaparece, bloqueador se quita, skeleton se reemplaza por contenido real

---

## Validación de consistencia con `task_plan.md`

### Puntos fuertes del plan v5

| Aspecto | Justificación |
|---|---|
| **Separación `error` vs `degraded`** | `degraded` renderiza dashboard con banner, `error` muestra pantalla de acciones múltiples. Sin ambigüedad semántica |
| **Migración BD indexada** | DB_VERSION 7→8 con upgrade handler para `retryCount`. Manejo de `blocked` ya existente en estructura actual |
| **Frontera hexagonal respetada** | Eventos personalizados desde `infrastructure` hacia `presentation` — patrón correcto para cruzar capas (K.8). Toast solo desde `presentation` |
| **Acciones con tooltips** | Cumple regla obligatoria de `task_plan.md` línea 147 |
| **Clasificación errores K.5** | Matriz exacta de `task_plan.md` líneas 565-572. Sin memoización innecesaria (fases secuenciales) |
| **Banner degradado reutiliza `CorruptionRepairCenter`** | Mismo componente, mismo estado `showRepairCenter`. Sin duplicación |
| **`blocking` state coherente con `task_plan.md`** | Contrato actualizado: layout visible + skeleton + navegación bloqueada |
| **Componentes existentes reutilizados** | `<Skeleton>` de `data-display/Skeleton.tsx`, `<TooltipHint>` de `ui/tooltip.tsx`, `<CorruptionRepairCenter>` de `data-repair/` |
| **Callbacks definidos con `useCallback`** | `retryBoot` y `skipAndContinue` tienen implementación explícita, no son referencias huérfanas |
| **`lastFailedPhase` para mensajes específicos** | K.5 guarda fase fallida en store; K.7 lo consume para mensajes concretos en DegradedBanner |
| **Barrel exports** | `useClickOutside` exportado desde `hooks/ui/`, `SkeletonDashboard` desde `components/layout/` |
| **Navegación bloqueada con `disabled` prop** | Cadena semántica `Sidebar` → `SidebarSection` → `SidebarNavItem`. Sin overlays ni pointer-events |

### Tests existentes que se rompen

| Archivo test | Razón del fallo |
|---|---|
| `DashboardLayout.test.tsx` | ⚠️ **No existe**. Debe crearse desde cero cubriendo: error screen con 3 botones, `degraded` con DegradedBanner, `blocking` con layout+skeleton+CacheProgressBar floating. |
| `useAppLoader.test.ts` | Verifica que errores en `warehouses` sin cache → `error`. Con K.5: sin cache es `error`, con cache es `degraded` |
| `CorruptionRepairCenter.test.tsx` | Asume que `retryCount` no existe y `CorruptionStatus` no incluye `'quarantined'` |
| `CacheProgressBar.test.tsx` | ⚠️ **No existe**. Debe crearse cubriendo variantes `inline` y `floating`, colapsar/expandir, click-outside-to-close. |

### Tests que requieren extensión

| Test | Qué agregar |
|---|---|
| `SidebarNavItem.test.tsx` (si existe) o test de integración | Verificar que `disabled` prop previene navegación y aplica clase `cursor-not-allowed` |
| `useAppLoader.test.ts` | Agregar casos: `handlePhaseError` clasifica correctamente según `hasCoreDataset` |
| `CorruptionRepairCenter.test.tsx` | Agregar casos: `retryCount` se incrementa, `quarantined` después de 3 retries |
| `CacheProgressBar.test.tsx` (nuevo) | Variante `inline` y `floating`, colapsar/expandir, click-outside-to-close ✕ |
| `SkeletonDashboard.test.tsx` (nuevo) | Renderiza sin errores, usa `<Skeleton>` component, 4+ elementos visibles |
| `DashboardLayout.test.tsx` (nuevo) | 3 estados: `error` (3 botones+tooltips), `blocking` (layout+skeleton+CacheProgressBar floating), `ready` (layout normal con/sin DegradedBanner) |

### Recomendaciones implementadas en v5

| Recomendación | Dónde se aplicó |
|---|---|
| Definir `retryBoot` y `skipAndContinue` como callbacks locales con `useCallback` | K.2 — Notas actualizadas con definiciones explícitas + import de `useAuthStore` para `userId` |
| `userId` desde `useAuthStore().user.id` (no hardcoded) | K.2, K.3 — sourcing desde hook de auth |
| `hasCoreDataset` refactorizado como función compartida en `core/loading/` | K.5 — nota de extracción agregada para reutilizar con rehydrate_local |
| Upgrade handler v7→8 usa `transaction.objectStore()` no `db.transaction()` | K.6 — corregido patrón de upgrade (evita transacción anidada inválida) |
| `toast.warning()` desde `DashboardLayout` no desde `DownloadQueueService` | K.8 — fix arquitectura hexagonal: infrastructure dispara custom event, presentation maneja toast |
| `<Skeleton>` reutilizado de `data-display/Skeleton.tsx` | K.9 — SkeletonDashboard usa componente base existente |
| Prop `disabled` propagada por cadena `Sidebar` → `SidebarSection` → `SidebarNavItem` | K.9 — enfoque semántico en lugar de overlay con z-index |
| K.7 + K.9 condiciones de loading alineadas: `isBlocking` → layout+skeleton, `isAppReady` → layout normal | K.7 — notas de integración explícitas |

---

## Progreso

| Fase | Nombre | Estado | Alineado con `task_plan.md`? |
|---|---|---|---|
| **K** | Romper ciclo infinito: ErrorScreen + RepairCenter visible | ✅ Completo | ✅ Secciones: Reanudación de carga, Matriz de respuesta, Auditoría clasificada, Formato mensajes, Política Feedback UI |
| **K.1** | Verificar `'degraded'` en todos los switch/if | ✅ Completo | Todos los places manejan `degraded` correctamente |
| **K.2** | Error screen con opciones según tipo de error | ✅ Completo | Línea 562: ErrorState con acciones múltiples. Líneas 611-618: formato mensajes |
| **K.3** | `CorruptionRepairCenter` renderizado condicional | ✅ Completo | Línea 685: Chunk corrupto → RepairCenter |
| **K.4** | Badge de corrupción en sidebar | ✅ Completo | `useCorruptionCount` hook creado. Badge rojo en icono de Auditoría |
| **K.5** | Error classification crítico vs diagnóstico | ✅ Completo | Líneas 565-572: Matriz de error por tipo de arranque |
| **K.6** | Límite de 3 retries + quarantine | ✅ Completo | Línea 649: `corruption` → 3 intentos, luego quarantine |
| **K.7** | Degraded state: layout renderiza con banner degradado | ✅ Completo | Líneas 563, 703: `degraded` renderiza dashboard no error screen |
| **K.8** | Toast con link al RepairCenter | ✅ Completo | Línea 685: Toast dirige al RepairCenter |
| **K.9** | Loading UX: skeleton + CacheProgressBar colapsable + navegación bloqueada | ✅ Completo | Línea 702: `blocking` → layout visible + skeleton + colapsed progress. Navegación bloqueada (logout exceptuado) |

---

## Matriz de verificación por subfase

| Check | K.1 | K.2 | K.3 | K.4 | K.5 | K.6 | K.7 | K.8 | K.9 |
|---|---|---|---|---|---|---|---|---|---|---|
| `pnpm build` sin errores | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `pnpm lint` sin errores | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `pnpm test:run` pasa | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comportamiento visual conservado | ✅ | N/A | N/A | ✅ | N/A | N/A | N/A | N/A | ✅ |
| Arreglo condición loading DashboardLayout | N/A | N/A | N/A | N/A | N/A | N/A | ✅ | N/A | N/A |
| Nuevos tests para el cambio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Identificar y actualizar tests existentes rotos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Alineado con `task_plan.md` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ * |
| click-outside-to-close funcional | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| SkeletonDashboard reutiliza `<Skeleton>` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Logout accesible durante loading | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Toast en presentation (hexagonal) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `retryBoot`/`skipAndContinue` definidos | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `disabled` prop en Sidebar → SidebarSection → SidebarNavItem | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

\* K.9 actualiza el contrato de `blocking` en `task_plan.md` línea 702 — no lo viola, lo modifica con aprobación del usuario.

---

## Referencias

- `docs_dev/task_plan.md` — Plan canónico del proyecto (principios P1–P5, clasificación de errores, política de feedback UI, reanudación de carga, formato de mensajes)
- `docs_dev/audit-report.md` — Auditoría de coherencia (22 FIXes, 4 WARNs)
- `frontend/src/presentation/shared/components/data-repair/CorruptionRepairCenter.tsx` — Componente de reparación existente (huérfano)
- `frontend/src/presentation/shared/components/layout/DashboardLayout.tsx` — Error screen actual a modificar
- `frontend/src/presentation/shared/hooks/storage/useAppLoader.ts` — Lógica de carga por fase
- `frontend/src/infrastructure/storage/DownloadQueueService.ts` — Donde se escriben CorruptionEntry
- `frontend/src/core/loading/appLoaderStore.ts` — Tipos de availability
- `frontend/src/core/loading/types/corruption.ts` — Tipo `CorruptionEntry` (agregar `retryCount`)
