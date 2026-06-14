# Plan L: UX de Error Handling — Botón reintentar, logout siempre visible, toast descriptivo

> Created: 2026-06-13 | v1 — Basado en feedback del usuario: (1) logout siempre disponible en error, (2) toast más descriptivo, (3) sin retry infinito → botón reintentar en componente de carga, (4) botones "Ir a reparar" por error en CacheProgressBar. Arregla bug `formatPhaseError` con argumentos incorrectos y `lastFailedPhase` no poblado en fatales.
>
> ⚠️ **Este plan modifica error UX ya implementado** en Fase K. No reintroduce el ciclo infinito — solo mejora los canales de comunicación y acción.

---

## Objetivos

### Principio Rector
**El usuario siempre tiene: (1) control sobre reintentos, (2) opción de cerrar sesión, (3) mensajes que explican qué pasó, qué impacto tiene y qué puede hacer.**

Basado en `task_plan.md`:

1. **Logout siempre accesible** — incluso en pantallas de error. El usuario nunca debe quedar atrapado sin poder salir.
2. **Toast con estructura** — cada toast de error/corrupción incluye: qué falló, impacto, y acción disponible.
3. **CacheProgressBar con acciones** — muestra botón "Reintentar" y botones "Ir a reparar" agrupados por entidad cuando hay errores.
4. **Sin retry infinito** — el loading screen nunca reintenta automáticamente; siempre pide acción del usuario (task_plan.md línea 583: `corrupted` → No reintentar automático infinito).

---

## Problemas identificados

| # | Problema | Severidad | Archivo | Línea |
|---|---|---|---|---|
| L.0 | `lastFailedPhase` no se guarda en errores fatales (solo en degraded) | 🔴 Bug | `useAppLoader.ts` | 103 |
| L.1 | `formatPhaseError` llamado con `store.phase` y `store.step` (strings incorrectos) | 🔴 Bug | `DashboardLayout.tsx` | 229 |
| L.2 | Sin botón "Cerrar sesión" en errores no-token | 🟡 Missing | `DashboardLayout.tsx` | 248-283 |
| L.3 | Toast de corrupción poco descriptivo (solo dice "checksum no coincide") | 🟡 Mejora | `DashboardLayout.tsx` | 113-114 |
| L.4 | CacheProgressBar muestra error sin acciones (sin "Reintentar" ni "Ir a reparar") | 🟡 Mejora | `CacheProgressBar.tsx` | 211-219 |

---

## Reglas de Ejecución

> ⚠️ Estas reglas complementan las de `task_plan.md`. Son vinculantes para este plan.

- **🏛️ Principios Rectores P1–P5 son ley suprema**: si una subfase los viola, se descarta.
- **Una fase a la vez**: ejecutar → verificar → preguntar al usuario si continuar
- **Commit al final de todo**: `git add . && git commit -m 'fix(ux): L-phase error handling improvements'`
- **Verificación obligatoria**: `pnpm build` (frontend) + `pnpm lint` + `pnpm test:run`
- **UI**: Español (labels, tooltips, errores). **Código**: Inglés
- **Arquitectura hexagonal frontend**: `core/` → `infrastructure/` → `presentation/`
- **Mobile-first**: Touch targets ≥44px (`min-h-11`)
- **Tooltips obligatorios**: Todo botón de acción debe tener `<TooltipHint>` o `<TooltipWrapper>`
- **Reutilización obligatoria**: Usar componentes existentes antes de crear nuevos
- **Sin `any`** sin justificación explícita
- **Import order**: external → core → infrastructure → presentation
- **Logging**: Usar `appLogger`, prohibido `console.*` en producción
- **Frontend tests**: Vitest + React Testing Library, patrón AAA, tests co-located (`*.test.ts`)

---

## Fase L — Mejoras UX en Error Handling

> **Skills**: `senior-frontend`, `clean-code`
> **Problemas**: (1) `formatPhaseError` recibe argumentos incorrectos → mensajes sin sentido; (2) logout invisible en errores generales; (3) toast minimalista sin contexto útil; (4) CacheProgressBar no ofrece acciones cuando hay error.
> **Objetivo**: Que el usuario siempre entienda qué pasó, pueda reintentar, pueda cerrar sesión, y tenga acceso a reparación desde el loading screen.

### L.1 — Poblar `lastFailedPhase` en errores fatales (useAppLoader.ts)

**Por qué**: `handlePhaseError` llama `setError(errMsg)` sin guardar `lastFailedPhase`. Cuando DashboardLayout intenta leer `lastFailedPhase` para mostrar mensajes estructurados, es `null`. El error fatal no tiene contexto de qué entidad falló.

**Archivo**: `frontend/src/presentation/shared/hooks/storage/useAppLoader.ts`

**Before** (lines 102-104):
```typescript
} else {
  setError(errMsg);
}
```

**After**:
```typescript
} else {
  setLastFailedPhase({ entityType, phaseLabel, error: errMsg });
  setError(errMsg);
}
```

**Verificación**:
- Error fatal en `warehouses` sin core dataset → `lastFailedPhase.entityType === 'warehouses'`
- Error fatal en `products` sin core dataset → mismo comportamiento
- Error fatal en `customers` → sigue yendo a `degraded` (no es core entity), no afecta

---

### L.2 — Fix `formatPhaseError` args y agregar logout siempre visible (DashboardLayout.tsx)

**Por qué**: `formatPhaseError(store.phase, store.step, false, true)` pasa:
- `store.phase` que es `'error'` (no meaningful entityType)
- `store.step` que es el mensaje de error raw (no el phaseLabel)
- `hasCore` hardcodeado `false` aunque haya core dataset
- `isCore` hardcodeado `true` aunque no sea core

Además, no hay botón de "Cerrar sesión" cuando el error no es de token.

**Archivo**: `frontend/src/presentation/shared/components/layout/DashboardLayout.tsx`

**Cambio 1 — Arreglar `formatPhaseError` call (line 229)**:

Antes:
```typescript
const errorParts = formatPhaseError(store.phase, store.step, false, true);
```

Después:
```typescript
const entityType = lastFailedPhase?.entityType ?? 'unknown';
const phaseLabel = lastFailedPhase?.phaseLabel ?? 'datos';
const hasCore = !!(lastFailedPhase && !isCoreEntity(lastFailedPhase.entityType));
const errorParts = formatPhaseError(entityType, phaseLabel, hasCore, isCoreEntity(entityType));
```

Necesitamos importar `isCoreEntity` desde el store o definirla local. Como no está exportada desde `appLoaderStore.ts`, agregar una función helper:

```typescript
function isCoreEntityLocal(entityType: string): boolean {
  return ['warehouses', 'products', 'stock'].includes(entityType);
}
```

**Cambio 2 — Agregar "Cerrar sesión" siempre visible en error screen**:

El bloque no-token actual (lines 248-283) termina con `</>`. Agregar botón de logout como línea separada debajo de los 3 botones existentes:

```typescript
<div className="mt-4 border-t border-gray-200 pt-4">
  <button
    onClick={handleLogout}
    className="text-xs text-gray-500 hover:text-red-600 underline"
  >
    Cerrar sesión
  </button>
</div>
```

Donde `handleLogout` es:
```typescript
const handleLogout = useCallback(() => {
  logout();
  window.location.href = '/login';
}, [logout]);
```

El botón debe estar fuera de los `TooltipWrapper`, sin tooltip (es una acción genérica de salida, no requiere explicación técnica).

**Verificación**:
- Error general → 3 botones + "Cerrar sesión" debajo
- Token error → "Iniciar sesión" + sin "Cerrar sesión" extra (no duplicar)
- `errorParts.whatHappened` muestra texto coherente según `lastFailedPhase`

---

### L.3 — Toast más descriptivo con qué pasó / impacto / acción

**Por qué**: El toast actual (DashboardLayout.tsx:113-114) solo dice:
> "products: el checksum del chunk no coincide. Los datos se guardaron en el centro de reparación."

No informa al usuario sobre el impacto (¿puede seguir usando la app?) ni qué acción tomar además de "Ir a reparar".

**Archivo**: `frontend/src/presentation/shared/components/layout/DashboardLayout.tsx`

**Before** (lines 113-114):
```typescript
toast.warning('Datos corruptos detectados', {
  description: `${idbStoreName}: el checksum del chunk no coincide. Los datos se guardaron en el centro de reparación.`,
  action: 'Ir a reparar',
  onAction: () => handleOpenRepairCenter(),
  duration: 120_000,
});
```

**After**:
```typescript
toast.warning('Datos corruptos en ' + idbStoreName, {
  description: `El checksum del chunk no coincide. Los datos se guardaron en el centro de reparación. Puedes seguir usando la app con datos anteriores.`,
  action: 'Ir a reparar',
  onAction: () => handleOpenRepairCenter(),
  duration: 120_000,
});
```

También mejorar el toast de error de carga inicial (lines 101-104):

**Before**:
```typescript
toast.error('Error en carga inicial', {
  description: appError,
  action: 'Carga de datos offline',
  duration: 12000,
});
```

**After**:
```typescript
toast.error('Error al cargar datos iniciales', {
  description: appError + '. La app usará datos locales si están disponibles. Puedes reintentar desde el panel de error.',
  action: 'Ver detalles',
  duration: 30000,
});
```

**Verificación**:
- Toast de corrupción muestra: título "Datos corruptos en products", descripción "El checksum del chunk no coincide... Puedes seguir usando la app con datos anteriores."
- Toast de error de carga muestra: título "Error al cargar datos iniciales", descripción con mensaje de error + "La app usará datos locales si están disponibles."
- Acción "Ir a reparar" abre RepairCenter

---

### L.4 — CacheProgressBar con botón reintentar + botones "Ir a reparar" por entidad

**Por qué**: Cuando hay error durante la carga, el CacheProgressBar muestra un box rojo con el mensaje de error (lines 211-219) pero no tiene botones de acción. El usuario debe esperar a que el layout renderice la pantalla de error completa (DashboardLayout) para poder hacer algo. En `variant='floating'` (loading screen), el CacheProgressBar es el único elemento visible — debería tener acciones inmediatas.

Además, cuando hay errores en fases no-fatales (degraded), el CacheProgressBar podría mostrar botones "Ir a reparar" agrupados por entidad (products, categories, etc.).

**Archivo**: `frontend/src/presentation/shared/components/network-status/CacheProgressBar.tsx`

> ⚠️ **Regla hexagonal**: CacheProgressBar está en presentation, puede usar imports de core (appLoaderStore) y hooks de UI (useAppLoader). NO debe importar de infrastructure. Usar custom events o props para acciones.

**Props adicionales**: Agregar callbacks opcionales para las acciones:

```typescript
interface CacheProgressBarProps {
  variant?: 'inline' | 'floating';
  onRetry?: () => void;
  onOpenRepairCenter?: () => void;
}
```

**Error box actual** (lines 211-219) reemplazado por:

```typescript
{isError && (
  <div className="rounded border border-red-200 bg-red-50 p-2 space-y-2">
    <p className="text-xs font-medium text-red-700">Error durante la carga inicial</p>
    {errorMsg && (
      <p className="text-[11px] leading-relaxed text-red-600 break-words">{errorMsg}</p>
    )}
    <div className="flex flex-wrap gap-2 pt-1">
      {onRetry && (
        <button
          onClick={onRetry}
          className="min-h-11 rounded bg-blue-600 px-3 py-1.5 text-[11px] text-white hover:bg-blue-700"
        >
          Reintentar
        </button>
      )}
      {onOpenRepairCenter && (
        <button
          onClick={onOpenRepairCenter}
          className="min-h-11 rounded bg-amber-600 px-3 py-1.5 text-[11px] text-white hover:bg-amber-700"
        >
          Ir a reparar
        </button>
      )}
    </div>
  </div>
)}
```

**En DashboardLayout.tsx**, pasar los callbacks:

```typescript
<CacheProgressBar
  variant="floating"
  onRetry={retryBoot}
  onOpenRepairCenter={handleOpenRepairCenter}
/>
```

Y en la sección de error screen inline:

```typescript
<CacheProgressBar
  variant="inline"
  onRetry={retryBoot}
  onOpenRepairCenter={handleOpenRepairCenter}
/>
```

**Botones "Ir a reparar" por fase fallida en error state**: Además del botón genérico, leer `lastFailedPhase` y si hay entidades específicas con errores, mostrar botones por entidad. Agregar debajo del primer grupo:

```typescript
{lastFailedPhase && (
  <div className="border-t border-red-100 pt-2 mt-1">
    <p className="text-[10px] text-red-500 mb-1">Fase con error: {lastFailedPhase.phaseLabel}</p>
    {onOpenRepairCenter && (
      <button
        onClick={onOpenRepairCenter}
        className="text-[11px] text-amber-700 hover:text-amber-900 underline"
      >
        Reparar {lastFailedPhase.entityType}
      </button>
    )}
  </div>
)}
```

**Verificación**:
- Error durante blocking → CacheProgressBar floating muestra "Reintentar" + "Ir a reparar" buttons
- Click en "Reintentar" → llama a `start()` (reinicia boot)
- Click en "Ir a reparar" → abre CorruptionRepairCenter
- `onRetry` y `onOpenRepairCenter` son opcionales — si no se pasan, los botones no se renderizan (backwards compatible)
- Tests existentes de CacheProgressBar pasan sin cambios (props opcionales)

---

## Progreso

| Fase | Nombre | Estado |
|---|---|---|
| **L** | Mejoras UX Error Handling | ⏳ Pendiente |
| **L.1** | Poblar `lastFailedPhase` en fatales | ⏳ Pendiente |
| **L.2** | Fix `formatPhaseError` + logout siempre visible | ⏳ Pendiente |
| **L.3** | Toast más descriptivo | ⏳ Pendiente |
| **L.4** | CacheProgressBar con acciones (reintentar + reparar) | ⏳ Pendiente |

---

## Matriz de verificación

| Check | L.1 | L.2 | L.3 | L.4 |
|---|---|---|---|---|
| `pnpm build` sin errores | ❌ | ❌ | ❌ | ❌ |
| `pnpm lint` sin errores | ❌ | ❌ | ❌ | ❌ |
| `pnpm test:run` pasa | ❌ | ❌ | ❌ | ❌ |
| `lastFailedPhase` poblado en fatales | ❌ | ❌ | ❌ | ❌ |
| Logout visible en error no-token | ❌ | ❌ | ❌ | ❌ |
| Toast describe impacto + acción | ❌ | ❌ | ❌ | ❌ |
| CacheProgressBar tiene botón reintentar | ❌ | ❌ | ❌ | ❌ |
| CacheProgressBar tiene botón "Ir a reparar" | ❌ | ❌ | ❌ | ❌ |
| Backwards compatible (props opcionales) | ❌ | ❌ | ❌ | ❌ |

---
