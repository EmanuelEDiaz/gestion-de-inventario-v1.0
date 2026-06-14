# Plan O: Remaining Gaps from task_plan.md

> Created: 2026-06-13 | Audit del codebase vs `task_plan.md` (canónico). Refleja todo lo NO implementado aún de las fases A–I. Fases M (loop fix, commit cebe809) y N (schemas alineados, commit 7cbba0f) están completas.

---

## 🔴 Prioridad Alta

### ✅ O.1 — Backend `serverPayload` real en SyncPushController

**Commit**: `8c4fb80` | **Subfases**: O.1.A (OperationResult+errorCode), O.1.B (CurrentEntityFetcher), O.1.C (controller enrichment), O.1.D (tests)

**Qué se hizo**:
- `OperationResult` record tiene nuevo campo `errorCode` extraído de `DomainException.getErrorCode()`
- Nuevo `CurrentEntityFetcher` service mapea entity types (PRODUCT, CATEGORY, CUSTOMER, SUPPLIER, WAREHOUSE) a sus repositorios y retorna `Map<String,Object>` via Jackson
- `SyncPushController` enriches rejected OperationResults con: `errorCode`, `serverPayload` (estado actual DB), `clientPayload` (payload original request), `serverVersion`
- **Verificado**: `mvn compile` OK, 93/93 tests pasan (excluyendo ProductControllerTest preexistente)

---

## 🟡 Prioridad Media

### ✅ O.2 — Geo search offline (hooks + población de geoIndex)

**Commit**: `6df9c06` | **Subfases**: O.2.A (exploración), O.2.B (hooks + fix DBSchema), O.2.C (background task), O.2.E (verificación)

**Qué se hizo**:
- Fix DBSchema `geoIndex` type: agregados campos `name`, `aliases`, `center`, `bbox`, `countryCode` que ya se guardaban via `as never`
- Fix `by-parent` index type: cambió de `string[]` a `string` (multiEntry index se consulta con string individual)
- Creados `useProvinces.ts` y `useMunicipalities.ts` en `hooks/map/`
- Agregado `populate_geo_index` como background task en `useBackgroundTasks.ts` (se ejecuta post-`ready_partial`)
- Fix `useGeoIndexLoader.ts` eliminó `as never`
- `useGeoSearch.ts` ya existía y funciona (solo requirió fix de DBSchema)
- **Verificado**: `tsc --noEmit` OK, `pnpm test:run` 219/219 OK

---

### O.3 — Migrar Currency/ExchangeRate/CustomerDebt repos a local-first

**Archivos**:
- `frontend/src/infrastructure/repositories/currency/CurrencyRepository.ts`
- `frontend/src/infrastructure/repositories/exchange-rate/ExchangeRateRepository.ts`
- `frontend/src/infrastructure/repositories/customer/CustomerDebtRepository.ts`

**Problema**: Estos 3 repos aún usan `apiClient.get` como fuente primaria de lectura. El loader descarga currencies, exchange_rates y customer_debts a IDB durante el boot, pero la UI vuelve a pedirlos por HTTP. Viola P3 (offline indefinido).

**Referencia**: task_plan.md línea 1745-1761 (tabla de migración), línea 208: "La UI lee SIEMPRE desde repositorios locales basados en IDB."

**Solución**: Cada repositorio debe cambiar de:
```typescript
// ❌ HTTP-first
async getAll(): Promise<Currency[]> {
  return readWithCache(() => apiClient.get('/api/v1/currencies'), () => db.getAll('currencies'));
}
// ✅ Local-first
async getAll(): Promise<Currency[]> {
  return db.getAll('currencies');
}
```

Mantener `create`/`update`/`delete` con outbox.

**Verificación**: `rg "apiClient\\.get" frontend/src/infrastructure/repositories/ --include '*.ts'` NO debe mostrar currency, exchange-rate, customer-debt.

---

### O.4 — currencies/exchange_rates/customer_debts failures invisibles

**Archivo**: `frontend/src/presentation/shared/hooks/storage/useAppLoader.ts`

**Problema**: Los handlers de `currencies`, `exchange_rates` y `customer_debts` atrapan errores solo con `appLogger.warn()` y avanzan a la siguiente fase. NO llaman a `handlePhaseError`, NO setean `lastFailedPhase`, NO degradan `availability`. Si fallan en primer arranque, el usuario no tiene feedback.

**Referencia**: task_plan.md línea 567-570: Errores en catálogos secundarios (non-core) → Non-fatal → degradan a `degraded`.

**Solución**: Reemplazar el bloque catch de estos 3 handlers con `handlePhaseError(entity, err, label)` manteniendo el avance de fase (no `return` como en core). Esto setea `lastFailedPhase` y degrada `availability` correctamente.

**Verificación**: Mockear error en fase `currencies`, verificar que `lastFailedPhase` se setea y `availability` se degrada a `degraded`.

---

### O.5 — README desactualizado

**Archivo**: `README.md` (raíz del proyecto)

**Problema**: El plan (Objetivo 6) exige README con arquitectura offline-first, stack real (PostgreSQL 17, endpoints correctos, sin duplicados).

**Referencia**: task_plan.md línea 129: "Actualizar README con arquitectura offline-first, stack real — README sin duplicados, PostgreSQL 17, endpoints correctos"

**Solución**: Reescribir README con:
- Stack real: Next.js 16 + React 19 + Spring Boot 3.4 + WebFlux + Java 21 + PostgreSQL 17
- Arquitectura offline-first con principios P1–P5
- Enlaces a `docs/contracts/` y `docs/adr/`
- Instrucciones de desarrollo local (`./start-dev.sh` y `./stop-dev.sh`)
- Eliminar secciones duplicadas con AGENTS.md y CLAUDE.md

---

## 🟢 Prioridad Baja

### ✅ O.6 — `catalog_refresh` task huérfana

**Commit**: `6df9c06` (incluido en O.2)

**Qué se hizo**: Eliminado `'catalog_refresh'` de `BackgroundTaskId` y reemplazado por `'populate_geo_index'`. Era dead code — no había runner registrado.

---

### O.7 — `ready_complete` literal nunca usado

**Archivos**: `frontend/src/core/loading/appLoaderStore.ts`, `frontend/src/presentation/shared/hooks/storage/useBackgroundTasks.ts`

**Problema**: `AppAvailability` incluye `'ready_complete'` y `AVAILABILITY_LABELS` tiene entrada para él. Pero NADIE setea `availability` a `'ready_complete'` — el hook `useReadyComplete()` computa un booleano derivado. El valor literal es dead code.

**Solución**: Si `useReadyComplete()` se usa en UI para mostrar badge "Todo listo", el literal `'ready_complete'` en `AppAvailability` es sobrante y puede eliminarse del union type. Si se necesita para selectores de UI, dejarlo como está documentado (derivado, no seteado).

---

### O.8 — `OfflineImage` component

**Archivo**: No existe — crear en `presentation/shared/components/images/`

**Problema**: task_plan.md línea 120 especifica "Tres niveles: thumbnail/preview/full-resolution en OPFS — OfflineImage con prop size". El hook `useImageCache` ya existe y cubre la lógica, pero no hay un componente React que abstraiga los tamaños.

**Solución**: Crear componente `<OfflineImage>` que:
- Toma `src` (API path), `size` (`'thumbnail' | 'preview' | 'full'`), `alt`, `className`
- Internamente usa `useImageCache`
- Muestra skeleton durante carga, fallback visual en error
- Auto-revoke de ObjectURLs en cleanup

---

## Reglas de Ejecución

- **🏛️ task_plan.md es canónico**: cualquier subfase que viole P1–P5 se descarta.
- **Una fase a la vez**: ejecutar → verificar → preguntar al usuario si continuar
- **Commit al final**: `git add . && git commit -m '<tipo>(<scope>): <mensaje>'`
- **Verificación**: `pnpm exec tsc --noEmit` + `pnpm test:run`
- **UI**: Español. **Código**: Inglés.
- **Mobile-first**: Touch targets ≥44px (`min-h-11`)
- **Frontend tests**: Vitest + RTL, patrón AAA

---

## Progreso

| Fase | Nombre | Estado |
|------|--------|--------|
| **O.0** | Fix pre-existentes (ProductControllerTest 500) | ✅ Completo (commit 19671e6) |
| **O.1** | Backend serverPayload real en SyncPushController | ✅ Completo (commit 8c4fb80) |
| **O.2** | Geo search offline (hooks + población) | ✅ Completo (commit 6df9c06) |
| **O.3** | Migrar Currency/ExchangeRate/CustomerDebt a local-first | ⏳ Pendiente |
| **O.4** | currencies/exchange_rates/customer_debts failures invisibles | ⏳ Pendiente |
| **O.5** | README desactualizado | ⏳ Pendiente |
| **O.6** | catalog_refresh task huérfana | ✅ Completo (incluido en O.2) |
| **O.7** | ready_complete literal nunca usado | ⏳ Pendiente |
| **O.8** | OfflineImage component | ⏳ Pendiente |
