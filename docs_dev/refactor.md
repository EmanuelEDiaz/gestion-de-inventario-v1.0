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

### O.2 — Geo search offline (ni hooks ni población)

**Archivos a crear**:
- `frontend/src/presentation/shared/hooks/storage/useGeoSearch.ts`
- `frontend/src/presentation/shared/hooks/storage/useProvinces.ts`
- `frontend/src/presentation/shared/hooks/storage/useMunicipalities.ts`

**Archivos a modificar**: `frontend/src/presentation/shared/hooks/storage/useAppLoader.ts`

**Problema**: El store `geoIndex` existe en IDB v5 con índices `by-type`, `by-name`, `by-parent`, pero NADIE lo puebla. Los hooks `useGeoSearch`, `useProvinces`, `useMunicipalities` no existen.

**Referencia**: task_plan.md:
- Línea 94: "Búsqueda geográfica offline (provincias, municipios, ciudades) — useGeoSearch('La Habana') retorna resultados sin red"
- Línea 1860-1902: Carga de geoIndex post-ready_partial (efecto separado en useAppLoader.ts)
- Línea 753: `geoIndex` full (Cuba) — provincias + municipios desde `/api/v1/geo/provinces?countryCode=CU` + `/api/v1/geo/municipalities/{provinceId}`

**Solución**:

1. **Crear `useGeoSearch.ts`** (en `hooks/storage/`):
   - Consulta `geoIndex` IDB store por `normalizedName` y `type`
   - Retorna `{ results, loading, error }`
   - Busca por substring case-insensitive en `normalizedName`

2. **Crear `useProvinces.ts`** (en `hooks/storage/`):
   - Lee todas las provincias desde `geoIndex` filtrado por `type === 'province'`
   - Cachea en memoria

3. **Crear `useMunicipalities.ts`** (en `hooks/storage/`):
   - Toma `provinceId` como parámetro
   - Lee municipios desde `geoIndex` filtrado por `type === 'municipality'` y `parentIds` contiene `provinceId`

4. **Poblar `geoIndex` post-ready_partial** en `useAppLoader.ts`:
   - Agregar `useEffect` que se ejecuta cuando `availability === 'ready_partial'`
   - Si `geoIndex` ya tiene datos (`db.count('geoIndex') > 0`), skip
   - Fetch provincias + municipios desde `GeoRegionRepository`
   - Guardar en IDB store `geoIndex`
   - Reintento máximo 3 veces en misma sesión si falla
   - No degrada `availability` — solo deshabilita búsqueda

**Verificación**: `pnpm exec tsc --noEmit` sin errores. Test unitario con mock de IDB.

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

### O.6 — `catalog_refresh` task huérfana

**Archivo**: `frontend/src/core/loading/backgroundTasksStore.ts`

**Problema**: El tipo `BackgroundTaskId` incluye `'catalog_refresh'` pero `useBackgroundTasks.ts` no registra runner para ella. Es dead code.

**Solución**: Eliminar `'catalog_refresh'` del tipo o implementar el runner.

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
| **O.1** | Backend serverPayload real en SyncPushController | ✅ Completo (commit 8c4fb80) |
| **O.2** | Geo search offline (hooks + población) | ⏳ Pendiente |
| **O.3** | Migrar Currency/ExchangeRate/CustomerDebt a local-first | ⏳ Pendiente |
| **O.4** | currencies/exchange_rates/customer_debts failures invisibles | ⏳ Pendiente |
| **O.5** | README desactualizado | ⏳ Pendiente |
| **O.6** | catalog_refresh task huérfana | ⏳ Pendiente |
| **O.7** | ready_complete literal nunca usado | ⏳ Pendiente |
| **O.8** | OfflineImage component | ⏳ Pendiente |
