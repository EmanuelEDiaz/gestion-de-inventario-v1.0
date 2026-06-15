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

### ✅ O.3 — Migrar Currency/ExchangeRate/CustomerDebt repos a local-first

**Commit**: `fec01fc`

**Nota**: CurrencyRepository y ExchangeRateRepository ya estaban migrados local-first. Solo CustomerDebtRepository estaba pendiente.

**Qué se hizo**:
- `CustomerDebtRepository.ts`: Migrado a local-first completo
  - `findAll`/`findOverdue`/`findById`/`findByCustomer`: todas leen de IDB (`db.getAll` / `db.get` / `db.getAllFromIndex`)
  - `update`/`cancel`: write API-first con outbox fallback, actualizan cache en éxito
  - `registerPayment`: write API-first con outbox fallback (no cachea DebtPayment — no hay store local)
- `useCustomerDebts.ts`: Cambiado de `customerDebtApi.getByCustomer()` a `customerDebtRepository.findByCustomer()`
- `useDebtPayment.ts`: Cambiado de `customerDebtApi.registerPayment()` a `customerDebtRepository.registerPayment()`
- Tests refactoreados al patrón ProductRepository (mock IDB, no mock API)

**Verificado**: `tsc --noEmit` OK, 224/224 tests pasan, `rg "apiClient.get" en los 3 repos` → 0 matches.

---

### ✅ O.4 — currencies/exchange_rates/customer_debts failures invisibles

**Archivo**: `frontend/src/presentation/shared/hooks/storage/useAppLoader.ts`

**Problema**: Los handlers de `currencies`, `exchange_rates` y `customer_debts` atrapan errores solo con `appLogger.warn()` y avanzan a la siguiente fase. NO llaman a `handlePhaseError`, NO setean `lastFailedPhase`, NO degradan `availability`. Si fallan en primer arranque, el usuario no tiene feedback.

**Referencia**: task_plan.md línea 567-570: Errores en catálogos secundarios (non-core) → Non-fatal → degradan a `degraded`.

**Solución**: Reemplazar el bloque catch de estos 3 handlers con `handlePhaseError(entity, err, label)` manteniendo el avance de fase (no `return` como en core). Esto setea `lastFailedPhase` y degrada `availability` correctamente.

**Commit**: `eb3b5e4`

**Qué se hizo**:
- `currencies`, `exchange_rates`, `customer_debts`: catch blocks cambiados de `appLogger.warn()` a `await handlePhaseError(...)`
- `handlePhaseError` setea `lastFailedPhase` + degrada `availability` a `degraded` (son recursos secundarios, non-core)
- Mantiene avance de fase (`setPhase('next')`) después del error

**Verificado**: `tsc --noEmit` OK, 224/224 tests pasan.

---

### ✅ O.5 — README desactualizado

**Commit**: `02c51cd`

**Qué se hizo**:
- README reescrito (76 líneas) con stack real en tabla, principios P1–P5 explícitos, arquitectura hexagonal frontend/backend, ADR-001 al ADR-013 referenciados
- Quick Start con `./start-dev.sh` como comando principal, referencias a `AGENTS.md` para comandos detallados (sin duplicación)
- Enlaces a `docs/contracts/` y `docs/adr/`
- Características actualizadas con offline-first, multi-almacén, POS, multi-moneda, mapas offline, PWA, RBAC, auditoría
- MIT license

**Verificado**: `tsc --noEmit` OK

---

## 🟢 Prioridad Baja

### ✅ O.6 — `catalog_refresh` task huérfana

**Commit**: `6df9c06` (incluido en O.2)

**Qué se hizo**: Eliminado `'catalog_refresh'` de `BackgroundTaskId` y reemplazado por `'populate_geo_index'`. Era dead code — no había runner registrado.

---

### ✅ O.7 — `ready_complete` literal nunca usado

**Commit**: `445a68d`

**Qué se hizo**:
- Removido `'ready_complete'` del union type `AppAvailability` (era dead code — nunca se setea)
- Removida entrada `ready_complete` de `AVAILABILITY_LABELS`
- `DashboardLayout.tsx`: simplificado `isAppReady` (solo `ready_partial` + `degraded` bastan)
- `CacheProgressBar.tsx`: reemplazado con `useReadyComplete()` para mostrar "Todo listo" cuando background tasks terminan
- `HealthPanelSections.tsx`: badge ahora usa `useReadyComplete()` (antes nunca se mostraba verde)
- `useMaintenance.ts`: simplificado guard (solo verifica `ready_partial`)

**Verificado**: `tsc --noEmit` OK, 224/224 tests pasan.

---

### ✅ O.8 — `OfflineImage` component

**Commit**: `0dbb940` (Phase G original)

**Qué se hizo**: El componente `OfflineImage` ya existía en `presentation/shared/components/media/OfflineImage.tsx` desde la Phase G. No requiere cambios — cumple todos los requisitos:
- Props: `imageKey` (API path), `size` (`'thumbnail' | 'preview' | 'full'`), `alt`, `className`, `fallbackIcon`
- Internamente usa `useImageCache` con auto-revoke de ObjectURLs
- Muestra `<Skeleton>` durante carga y fallback visual (`<ImagePlus>`) en error
- Verificado: `tsc --noEmit` OK, 224/224 tests pasan

*Nota: El componente fue creado en `0dbb940` pero nunca integrado en UI. Su uso queda fuera del alcance de este plan (no tiene bugs ni gaps estructurales).*

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
| **O.3** | Migrar Currency/ExchangeRate/CustomerDebt a local-first | ✅ Completo (commit fec01fc) |
| **O.4** | currencies/exchange_rates/customer_debts failures invisibles | ✅ Completo (commit eb3b5e4) |
| **O.5** | README desactualizado | ✅ Completo (commit 02c51cd) |
| **O.6** | catalog_refresh task huérfana | ✅ Completo (incluido en O.2) |
| **O.7** | ready_complete literal nunca usado | ✅ Completo (commit 445a68d) |
| **O.8** | OfflineImage component | ✅ Completo (commit 0dbb940) |
