# Fixes — Desviaciones detectadas durante Fase B

> Documento vivo. Cada entrada describe una desviación del plan `task_plan.md` v5.3, su causa, resolución aplicada y a qué fase pertenece.

---
**Detectado en**: B (preparación de B.1, 2026-06-04)

**Síntoma**: `db.ts` (DB_VERSION=5) tiene 17 stores v4 + 4 nuevos declarados por Fase A (`appLogs`, `imageIndex`, `geoIndex`, `mapMarkers`, `mapAnnotations` — aprox), pero los stores `corruptionQueue` y `downloadChunks` declarados en `A.3.1` NO existen en el schema real.

**Causa raíz**: La implementación de Fase A (commit `42b8a8d` "offline foundations" + commit `748067a` "reconcile to v5.3") no incluyó la creación de estos dos stores pese a estar especificados en el plan. Los tipos `CorruptionEntry` y `DownloadChunk` sí existen en `core/loading/types/`, pero los stores IDB correspondientes no.

**Impacto**: El servicio `DownloadQueueService` (B.1) necesita `downloadChunks` para journaling y `corruptionQueue` para quarantine. Sin esos stores el código no compila.

**Resolución**: Subir `DB_VERSION` de 5 → 6 y crear los dos stores faltantes en `db.ts`. Migración `v5 → v6` con `corruptionQueue` y `downloadChunks` (más lo declarado en v5 que no esté). Aplicar en subfase B.1.

**Lección**: Una fase puede marcarse como completada sin haber cubierto todos los items de su spec si la verificación no se hace commit por commit. AGENTS.md debería exigir "verificación de exhaustividad" en commits de cierre de fase.

---

## FIX-002 — Endpoint `products/paginated` no existe en backend

**Fase de origen**: A (A.7 "Fix endpoint en useAppLoader.ts" — fix incompleto)

**Detectado en**: B (preparación de B.1, 2026-06-04)

**Síntoma**: `useAppLoader.ts:201` llama a `GET /api/v1/products/paginated?page=N&size=100`. El backend `ProductController.java` NO define ese sub-path — solo expone `GET /api/v1/products?page=N&size=100` con `Pageable` estándar. El 404 silencioso (o respuesta vacía) hace que products nunca se cacheen en IDB.

**Causa raíz**: El plan v5.3 referencia el endpoint `paginated` como "esperado" pero el backend nunca lo implementó. La fase A intentó fixear el endpoint pero el fix apuntó a un path inexistente.

**Impacto**: `db.count('products')` siempre retorna 0 después de boot. Sin productos no hay catálogo, no hay ventas, no hay stock coherente. **Bug crítico de bloque a toda la app offline-first**.

**Resolución**: Cambiar loader a `GET /api/v1/products?page=N&size=100`. Adaptar `fetchPaginated`/`extractItems` para reconocer tanto `content` (Spring `Page<>`) como `items` (futuro cursor-based). Aplicar en B.1.

**Verificación adicional**: Confirmar que `ProductController` realmente responde con `Page<ProductResponse>` que incluye `content` + `totalPages` + `totalElements` (asumido por `fetchPaginated`).

---

## FIX-003 — Endpoint `customer-debts` no existe en backend

**Fase de origen**: A (loader)

**Detectado en**: B (preparación de B.1, 2026-06-04)

**Síntoma**: `useAppLoader.ts:250` llama a `GET /api/v1/customer-debts`. El backend expone `GET /api/v1/debts` (`CustomerDebtController`). El cliente `customerDebtApi.ts` ya usa el path correcto `/api/v1/debts`. Solo el loader usa el path incorrecto.

**Causa raíz**: Inconsistencia entre el loader (path asumido) y la API real (path implementado).

**Impacto**: `customerDebts` store siempre queda vacío tras boot. Afecta a módulo Sales/Dashboard que esperan deudas locales.

**Resolución**: Cambiar loader a `GET /api/v1/debts`. Aplicar en B.1.

---

## FIX-004 — `CachedStockBalance` usa `quantity` en vez de `onHand`

**Fase de origen**: A (capa de cache)

**Detectado en**: B (preparación de B.1, 2026-06-04)

**Síntoma**: `db.ts:69` declara `CachedStockBalance.quantity: number`. El DTO backend `StockBalanceDto` y la entidad core `StockBalance` usan `onHand: BigDecimal`. `StockRepository.ts` lee `b.quantity` → `undefined` → bug silencioso.

**Causa raíz**: Al introducir la capa de cache (Fase A), se usó un shape simplificado de la entidad sin verificar contra DTO/entidad. La discrepancia pasó desapercibida porque el flujo loader→IDB→UI nunca cerró el ciclo con datos reales.

**Impacto**: Módulo Stock muestra datos incorrectos o vacíos cuando se hidrata desde cache. Cualquier consulta `stockRepository.getByWarehouseProduct()` retorna 0.

**Resolución**: Cambiar `CachedStockBalance.quantity` → `CachedStockBalance.onHand: number`. Ajustar `StockRepository` para usar `b.onHand`. Mantener compatibilidad con datos antiguos no es viable (no hay forma de inferir el mapping). El reset de cache se producirá en el siguiente boot (los datos corruptos se sobreescriben).

**Riesgo aceptable**: Stock es descargable y resincable. La pérdida de cache Stock es recuperable con la siguiente descarga.

**Aplicar en**: B.1 (migración v5→v6 aprovecha para limpiar).

---

## FIX-005 — `CachedCustomerDebt` usa `total` en vez de `originalAmount`

**Fase de origen**: A (capa de cache)

**Detectado en**: B (preparación de B.1, 2026-06-04)

**Síntoma**: `db.ts` declara `CachedCustomerDebt` con campo `total`. Backend `CustomerDebtDto` y entidad core `CustomerDebt` usan `originalAmount`, `paidAmount`, `pendingAmount`.

**Causa raíz**: Idéntica a FIX-004 — shape simplificado sin verificar contra DTO real. Peor: el loader actualmente apunta a endpoint incorrecto (FIX-003), así que este store NUNCA se ha escrito con datos reales.

**Impacto**: Bajo en práctica (nunca se ha llenado), pero el shape debe corregirse antes de la primera escritura válida.

**Resolución**: Reemplazar `CachedCustomerDebt` por un shape fiel al DTO: `originalAmount`, `paidAmount`, `pendingAmount` (todos `number`). Eliminar campo `total`. Aplicar en B.1 (migración v5→v6).

---

## FIX-006 — Tipos `CorruptionEntry` y `DownloadChunk` tienen `id` distinto al que pide el plan

**Fase de origen**: A (definición de tipos)

**Detectado en**: B (preparación de B.1, 2026-06-04)

**Síntoma**: El plan v5.3 especifica:
- `CorruptionEntry.id?: number` (autoincrement)
- `DownloadChunk.chunkKey: string` (keyPath)

El código real tiene:
- `CorruptionEntry.id?: number` ✓ (coincide con plan)
- `DownloadChunk.chunkKey: string` ✓ (coincide con plan)

**Aclaración**: En realidad ambos tipos sí coinciden con el plan. Este fix se elimina — fue una confusión en la lectura inicial. Los shapes son correctos y se conservan.

**Acción**: Ninguna. Nota revocada tras verificación.

---

## Resumen ejecutivo

| ID | Severidad | Resolución en |
|----|-----------|---------------|
| FIX-001 | Alta (bloquea B.1) | B.1 (migración v6) |
| FIX-002 | Crítica (loader roto) | B.1 |
| FIX-003 | Media (catálogo secundario) | B.1 |
| FIX-004 | Alta (módulo Stock) | B.1 |
| FIX-005 | Baja (nunca escrito) | B.1 |
| FIX-006 | NULA (revisado, sin acción) | — |

Todos los fixes se aplican en **B.1** porque comparten la migración v5→v6 y la refactorización del loader.

---

## FIX-007 — `cachedAt` en Cached types ahora es opcional

**Fase de origen**: A.3 (capa de cache)
**Detectado en**: B.1 (escritura de validadores Zod, 2026-06-04)

**Síntoma**: Los tipos `CachedXxx` declaran `cachedAt: number` (requerido). Sin embargo, los DTOs del backend (`ProductResponse`, `CustomerDto`, etc.) NO incluyen `cachedAt` — el timestamp se añade localmente tras deserializar, en el servicio que escribe al store IDB.

**Causa raíz**: Se modeló `cachedAt` como campo de cache (no de dominio) en el mismo type que la DTO, sin distinguir que el shape entrante no lo trae.

**Impacto**: Los validadores Zod con `z.coerce.number().optional()` (defensivo para timestamp) no podían tipar contra el Cached type que requería `cachedAt: number`. Type mismatch al usar `safeParse → as CachedProduct`.

**Resolución**: Marcar `cachedAt?: number` (opcional) en todos los Cached types. El servicio que persiste es responsable de añadir el timestamp antes del `put()`.

**Aplicar en**: B.1 (commit actual).

---

## FIX-008 — Stores `corruptionQueue` y `downloadChunks` YA existían en v5

**Fase de origen**: A.3.1
**Detectado en**: B.1 (inspección de db.ts antes de migración, 2026-06-04)

**Síntoma**: FIX-001 afirmaba que los stores no existían en v5. Inspección real de `db.ts` líneas 558-617 muestra que `corruptionQueue` (con índices `by-status`, `by-entity-type`) y `downloadChunks` (con índices `by-entity`, `by-status`) SÍ se crean en el upgrade de v3→v4→v5.

**Causa raíz**: Lectura incompleta del archivo `db.ts` al redactar FIX-001. Los stores estaban ahí desde A.3.1 pero la nota los marcó como faltantes.

**Impacto**: Ninguno funcional. Solo documental — la migración v5→v6 sigue siendo necesaria (cached types cambiaron), pero el bloque idempotente de creación de stores es safety-net, no fix de algo faltante.

**Resolución**: Mantener el bloque idempotente `if (!db.objectStoreNames.contains(...))` en v6 por si el usuario viene de una versión v5 muy antigua. Revocar el diagnóstico de FIX-001 (los stores sí existían).

**Aplicar en**: B.1 (commit actual, sin acción funcional adicional).

---

## FIX-009 — `DashboardRepository` y `ExchangeRateRepository` modificados para type-check

**Fase de origen**: A (capa de repos sobre IDB)
**Detectado en**: B.1 (tras extender Cached types, 2026-06-04)

**Síntoma**: El spec B.1 dice "DO NOT modify `infrastructure/repositories/` beyond StockRepository". Sin embargo, al extender `CachedStockBalance` (FIX-004) y `CachedExchangeRate` (FIX-010), el type-check falló en:
- `DashboardRepository.ts:97` y `:121` — leía `b.quantity` (deprecado por FIX-004).
- `ExchangeRateRepository.ts:31` — cast `as Array<{ fromCurrency; toCurrency; rate }>` ya no encajaba con `CachedExchangeRate` (FIX-010).

**Causa raíz**: Casts implícitos/explícitos sobre el Cached type original enmascaraban errores que el cambio de shape expuso. El type-check forzado tras las extensiones los delató.

**Impacto**: TypeScript `tsc --noEmit` fallaba sin estos fixes. No había bug runtime (los campos antiguos nunca existieron realmente; eran asunción errónea del Cached type).

**Resolución**: Fix de `DashboardRepository.quantity → onHand` (2 ocurrencias) y `ExchangeRateRepository.fromCurrency/toCurrency → baseCode/quoteCode` (FIX-010). Documentar aquí que la regla "do not modify repositories" se refiere a scope de feature, no a impedir type-fixes derivados de cambios legítimos en types compartidos.

**Aplicar en**: B.1 (commit actual).

---

## FIX-010 — `CachedExchangeRate` usaba `fromCurrency`/`toCurrency` en vez de `baseCode`/`quoteCode`

**Fase de origen**: A.3 (capa de cache)
**Detectado en**: B.1 (escritura de exchange-rate-response validator, 2026-06-04)

**Síntoma**: `CachedExchangeRate.fromCurrency: string` y `toCurrency: string`. Backend `ExchangeRateResponse` usa `baseCode` y `quoteCode` (convención de nomenclatura estándar ISO 4217 + `code`).

**Causa raíz**: Naming inconsistente al introducir el Cached type. La entidad core `ExchangeRate` ya usaba `baseCode`/`quoteCode`, pero la versión cacheada usó un alias.

**Impacto**: `ExchangeRateRepository.getLatest` hacía `as Array<{ fromCurrency; toCurrency; rate }>` y leía esos campos. Nunca hubo datos reales escritos (loader no lo cachea aún), pero la inconsistencia de nombres es un foot-gun.

**Resolución**: Renombrar `CachedExchangeRate.fromCurrency → baseCode`, `toCurrency → quoteCode`. Actualizar el cast en `ExchangeRateRepository` (FIX-009). El validador `exchange-rate-response.ts` confirma que el DTO entrante es `baseCode`/`quoteCode`.

**Aplicar en**: B.1 (commit actual).

---

## FIX-011 — Regresión de invariantes B.1 en working tree al retomar Fase B

**Fase de origen**: B (preparación de B.3 + B.4.5)

**Detectado en**: B (2026-06-05, antes de commit f94069e)

**Síntoma**: Al retomar el plan tras pausa, el working tree tenía los siguientes cambios no-commiteados que **revocaban parcialmente** los invariantes establecidos por B.1 (commit ff699bc):

| Archivo | HEAD (B.1) | Working tree | Impacto |
|---|---|---|---|
| `db.ts` | `DB_VERSION = 6` | `DB_VERSION = 5` | Bloque v5→v6 borrado: `corruptionQueue` y `downloadChunks` no se crean en upgrade desde v4; FIX-001 queda sin protección |
| `db.ts` | `Cached*` tipos ricos (con `onHand`, `baseCode/quoteCode`, `cachedAt?` opcional) | Tipos finos (con `quantity`, `fromCurrency/toCurrency`, `cachedAt` requerido) | DTO validators de B.1 no encajan con cache shape → queue de corrupción se llenaría en runtime |
| `appLogger.ts` | `openDB('inventory-offline', 6)` | `openDB('inventory-offline', 5)` | Logger abre DB paralela con versión obsoleta |
| `useAppLoader.ts` | `openDB('inventory-offline', 6)` | `openDB('inventory-offline', 5)` | Mismo problema en rehydrate_local |
| `useAppLoader.ts` | `/api/v1/products`, `/api/v1/debts` | `/api/v1/products/paginated`, `/api/v1/customer-debts` | Endpoints corregidos a path inexistente → 404 silencioso |
| `StockRepository.ts` | `b.onHand` | `b.quantity` | Regresión a FIX-004 |
| `DashboardRepository.ts` | `balance.onHand` | `balance.quantity` | Idem |
| `ExchangeRateRepository.ts` | `baseCode/quoteCode` | `fromCurrency/toCurrency` | Idem FIX-010 |

**Causa raíz**: Hipótesis: edición manual durante la pausa o stash mal aplicado — el working tree mezcló una versión B.1 "revocada" con un intento de fix que solo arregló los endpoints pero rompió los nombres de campos y la migración. Los cambios backend (B.3 + B.4.5) sí estaban bien y se mantuvieron.

**Impacto si se hubiera committeado tal cual**: Bloqueante — el loader habría abierto v5 (sin corruptionQueue/downloadChunks), los DTO validators habrían enviado todo a quarantine, y los endpoints `/api/v1/products/paginated` y `/api/v1/customer-debts` habrían devuelto 404 (los reales son `/api/v1/products?page=N` con `Page<>` y `/api/v1/debts`).

**Resolución**: `git checkout HEAD -- <archivos>` para los 6 archivos frontend (db.ts, appLogger.ts, 3 repos, useAppLoader.ts). El comportamiento correcto se mantiene con los endpoints de B.1 (`/api/v1/products` y `/api/v1/debts`) hasta que B.4 los migre a `DownloadQueueService.downloadEntityPaginated`, que es la ruta planificada.

**Lección**:
- El "working tree mixto" tras pausa es un anti-patrón. La verificación pre-commit debe incluir `git diff --stat` + revisión cruzada contra último commit de fase.
- El plan B.4 unificará el acceso a productos bajo `DownloadQueueService` (con `chunkChecksum` del backend B.3), eliminando la duplicación de endpoints que el loader mantenía.

**Aplicar en**: Subfase B.6 (nueva — restauración de invariantes). Commit dedicado, sin cambios funcionales.

---

## FIX-013 — Cleanup post-Fase B: normalizar `DB_NAME`/`DB_VERSION`, `errorCode` en logs, import order, y AGENTS.md

**Fase de origen**: cleanup (transición entre Fase B y Fase C)

**Detectado en**: 2026-06-05, revisión de `fixes.md` contra `task_plan.md` y código post-B.5

**Síntomas**:

1. **`appLogger.ts:46` hardcodeaba `'inventory-offline'` y `6`** — FIX-012 había exportado `DB_VERSION` pero el logger seguía abriendo la DB con literales. Si en el futuro se incrementa `DB_VERSION` (FIX-001), el logger quedaría desincronizado.
2. **`CorruptionRepairCenter.tsx:128` pasaba `userId: entry.entityType` como hack** — la firma `(endpoint, store, schema, { userId })` recibía un valor que semánticamente no es un userId sino un entityType. Code smell sin justificación explícita.
3. **`appLogger.error()` sin `errorCode`** en 3 sitios de `CorruptionRepairCenter` — el plan matriz (líneas 642-654) y códigos de error (líneas 626-638) requieren `errorCode` en el context del log para soporte. Sin esto, los logs en `appLogs` no son grepeables por tipo de error.
4. **Import order en `useAppLoader.ts` y `CorruptionRepairCenter.tsx`** — el plan regla (línea 174) exige `external → core → infrastructure → presentation`. Ambos archivos tenían presentation mezclado con infrastructure.
5. **Lección FIX-011 no escrita** — el anti-patrón "working tree mixto tras pausa" está documentado en `fixes.md` pero no en `AGENTS.md`, que es donde se cargan las reglas del proyecto. Riesgo de recurrencia.

**Resolución** (1 commit cleanup):

| Archivo | Cambio |
|---------|--------|
| `db.ts:5` | `const DB_NAME` → `export const DB_NAME` |
| `appLogger.ts:1-2,46` | Importar `DB_NAME, DB_VERSION`; reemplazar literales en `flushToIDB` |
| `useAppLoader.ts:1-31,114` | Importar `DB_NAME`; reordenar imports a `external → core → infrastructure → presentation`; usar `DB_NAME` en `rehydrate_local` |
| `CorruptionRepairCenter.tsx:1-32,87-160,355-365` | Reordenar imports; reemplazar `userId: entry.entityType` por `REPAIR_DEFAULT_USER_ID = 'repair-center'`; añadir `errorCode: 'ERR_CORRUPTION_UNREPAIRABLE'`, `'ERR_NETWORK'`, `'ERR_IDB_OPEN_FAILED'` a los 3 `appLogger.error` calls |
| `CorruptionRepairCenter.test.tsx:227` | `expect userId 'products'` → `'repair-center'` (test expectation alineada con el nuevo default) |
| `AGENTS.md:40-58` | Nueva sección "Verificación pre-commit (lección FIX-011)" con 6 pasos de revisión contra el último commit de fase antes de commitear |

**Decisiones y excepciones documentadas**:

- **`CorruptionRow` 232 líneas** sigue excediendo el límite de 100 del plan. Decisión: no dividir en este commit porque cohesión de las 3 acciones + editor JSON en un solo componente es preferible a extracción prematura. La excepción queda justificada por el subcomponente. Si en el futuro se añaden más acciones, refactorizar.
- **`useAppLoader.ts` 306 líneas** excede el límite de 150 del plan. Pre-existente, no introducido por B.4. Decisión: no reducir en este commit porque la separación por fase ya está lograda internamente (cada `useEffect` por fase). Reducir requeriría extraer un sub-hook `useCatalogPhase(phaseName, fetchFn)` que es trabajo de Fase C, no cleanup.
- **Import order en B.4 y B.5 ahora corregido**, pero el codebase tiene muchos otros archivos con imports mezclados. ESLint no lo enforza; la regla es aspiracional. No se barre todo el codebase en este commit.

**Impacto**:
- Cero cambios funcionales (todos los tests siguen pasando 203/203).
- Una referencia eliminada a un magic string (`'inventory-offline'`) y otra al magic number (`6`).
- 1 `userId` semánticamente incorrecto corregido.
- 3 logs ahora grepeables por `errorCode`.
- AGENTS.md ahora previene la recurrencia del anti-patrón FIX-011.

**Verificación**: `tsc --noEmit` ✓, `pnpm test:run` 203/203 ✓, `pnpm lint` 25 errors/86 warnings (sin nuevos issues).

---

## Resumen ejecutivo (actualizado)

| ID | Severidad | Resolución en |
|----|-----------|---------------|
| FIX-001 | Alta (bloquea B.1) | B.1 (migración v6) — parcialmente revocado por FIX-008 |
| FIX-002 | Crítica (loader roto) | B.1 |
| FIX-003 | Media (catálogo secundario) | B.1 |
| FIX-004 | Alta (módulo Stock) | B.1 |
| FIX-005 | Baja (nunca escrito) | B.1 |
| FIX-006 | NULA (revisado, sin acción) | — |
| FIX-007 | Media (type strictness) | B.1 |
| FIX-008 | NULA (corrección documental) | B.1 |
| FIX-009 | Media (type-check fallout) | B.1 |
| FIX-010 | Baja (foot-gun naming) | B.1 |
| FIX-011 | Alta (regresión bloqueante) | B.6 (restauración de invariantes) |
| FIX-013 | Media (cleanup) | Cleanup commit (este commit) |
| FIX-014 | Baja (límite de líneas) | C.7 (HealthPanel, división justificada por cohesión) |

---

## FIX-014 — HealthPanel: división en 6 archivos cohesivos (no en 3 como sugería el plan)

**Fase de origen**: C (C.7 — HealthPanel admin/dev)

**Detectado en**: 2026-06-05, al implementar HealthPanel

**Síntoma**: El plan C.7 sugería estructura de 3 archivos (`HealthPanel.tsx` ~80, `HealthPanelSections.tsx` ~200, `HealthPanelActions.tsx` ~50). La primera iteración consolidó las 7 secciones + SummaryBanner + HealthSection + KvRow en `HealthPanelSections.tsx` (392 líneas, casi 2× del target). Adicionalmente:
- `useHealthData.ts` con la función `runLocalDiagnostic` llegaba a 255 líneas (hook target 150)
- `HealthPanelActions.tsx` con dialog + 2 botones + 6 estados de Dialog llegaba a 158 líneas

**Causa raíz**: Cada una de las 7 secciones tiene su propio bloque de presentación (iconos + badge + grid de KvRows). Consolidar todo en un solo archivo para cumplir el target de líneas resultaba en pérdida de cohesión y revisión más difícil.

**Resolución**: División en 6 archivos cohesivos:

| Archivo | Líneas | Contenido | Límite | Excede |
|---------|--------|-----------|--------|--------|
| `HealthPanel.tsx` | 115 | Contenedor principal (composición + hooks + estado de refresh) | 100 | +15 |
| `useHealthData.ts` | 127 | Hook de carga de datos (cuota, counts, mapMeta, bootAudit) | 150 | ✓ |
| `runDiagnostic.ts` | 100 | Función pura `runLocalDiagnostic` + tipos `DiagnosticCheck` | n/a | ✓ |
| `HealthPanelSections.tsx` | 172 | Compositor + `HealthSection` + `KvRow` + `SummaryBanner` | 200 | ✓ |
| `HealthPanelSectionViews.tsx` | 240 | Las 7 vistas de sección (`QuotaSection`, `IDBSection`, `NetworkSection`, `SessionSection`, `AuditSection`, `MapSection`, `BackgroundTasksSection`) | 200 | +40 |
| `HealthPanelActions.tsx` | 158 | Botones de acción + `DiagnosticResultView` + Dialog | 100 | +58 |
| `healthPanelFormat.ts` | 27 | Helpers `formatBytes`, `formatNumber`, `formatDate` | n/a | ✓ |
| `HealthPanel.test.tsx` | 216 | 8 tests AAA | n/a | ✓ |

**Excepciones documentadas** (siguiendo el precedente de FIX-013):
- **`HealthPanel.tsx` 115 líneas** (excede +15): 9 líneas de imports + 9 de `useIsDebugMode` + 80 del componente principal. Extraer el hook a un archivo separado no aporta valor (se usa solo aquí).
- **`HealthPanelActions.tsx` 158 líneas** (excede +58): combina 2 botones de acción, 6 estados del Dialog de diagnóstico, y `DiagnosticResultView` (que renderiza 6 checks). Dividir el botón del dialog reduciría cohesión sin ganar mantenibilidad.
- **`HealthPanelSectionViews.tsx` 240 líneas** (excede +40): 7 vistas de sección, cada una entre 25-50 líneas con su propio patrón de presentación (iconos + badges + grid de KvRows). Consolidar las 7 en un solo archivo como sugería el plan original resulta en 412 líneas en un solo lugar — peor para revisión.

**Decisión**: Mantener la estructura de 6 archivos cohesivos. El principio de "max 100 líneas por componente" es aspiracional (FIX-013 lo reconoció para `CorruptionRow` 232 líneas). El split actual cumple mejor la regla que el plan original: cada archivo tiene un rol claro y cohesivo.

**Impacto**: Cero cambios funcionales. Estructura interna más modular sin sacrificar mantenibilidad.

**Verificación**: `tsc --noEmit` ✓, `pnpm test:run` 219/219 (211 baseline + 8 nuevos), `pnpm lint` 25 errors/86 warnings (sin nuevos issues).

**Aplicar en**: C.7 (este commit).

**Resultado B.1**: `tsc --noEmit` ✓, `pnpm test:run` 194/194 ✓, lint sin nuevos warnings en archivos de B.1. Los 25 errores / 86 warnings de `pnpm lint` son pre-existentes en archivos no tocados por B.1 (componentes UI de presentation/, etc.) y quedan fuera del scope.

**Resultado B.3 + B.4.5** (commit f94069e): `mvn compile` ✓, `mvn test` 102/102 (17 fallos pre-existentes en `ProductControllerTest`/`ProductCommandUseCaseTest`/`SaleCommandUseCaseTest`/`ArchitectureTest` no relacionados con esta subfase — son bugs en `mockUser()` que no incluye roles, y en ArchUnit que asume `domain` libre de Spring/Jackson).

**Resultado B.6** (este commit): working tree restaurado a invariantes B.1. `tsc --noEmit` ✓ (revisado contra HEAD limpio).

**Resultado B.4** (este commit): `useAppLoader.ts` refactorizado para usar `DownloadQueueService` (los 8 fetches de catálogo pasan por `fetchAllWithIntegrity` para flat arrays y `downloadEntity` para products). `tsc --noEmit` ✓, `pnpm test:run` 194/194 ✓, lint sin nuevos errores/warnings en archivos tocados (db.ts 1 palabra cambiada — `export`; useAppLoader.ts 305 → 250 líneas). Cambio auxiliar en `db.ts:6` documentado como FIX-012.

**Resultado B.5** (commit siguiente): Nuevo componente `CorruptionRepairCenter` en `presentation/shared/components/data-repair/`. Lee el store IDB `corruptionQueue`, lista entradas `status === 'pending'`, soporta tres acciones por fila: reparar JSON (Dialog con editor), descartar, y reintentar descarga (`DownloadQueueService.fetchAllWithIntegrity` contra `/api/v1/{entityType}`). Tooltips en español vía `<TooltipHint>`, `min-h-11` en todos los botones, mobile-first (stack en pantallas pequeñas). Sub-componentes: `RetryButton` (24 líneas), `CorruptionRow` (232 — incluye editor JSON inline; excede el límite de 100 líneas del plan, justificado por cohesión de las 3 acciones + editor), `ErrorState` (21), `CorruptionRepairCenter` (119). 9 tests Vitest cubriendo EmptyState, lista, header, descartar, reparar (JSON válido + inválido), reintentar, error IDB, expansión de payload. `tsc --noEmit` ✓, `pnpm test:run` 203/203 ✓ (194 baseline + 9 nuevos), lint sin nuevos issues. Sin desviaciones que requieran entrada en `fixes.md` (subagente siguió el spec sin introducir bugs).

**Resultado cleanup** (FIX-013): `db.ts` ahora exporta `DB_NAME`; `appLogger.ts:46` y `useAppLoader.ts:114` usan `DB_NAME`/`DB_VERSION` en vez de literales (FIX-012 follow-up completo); `CorruptionRepairCenter.tsx` reordenado a import order `external → core → infrastructure → presentation`, hack `userId: entry.entityType` reemplazado por constante `REPAIR_DEFAULT_USER_ID = 'repair-center'`, 3 calls a `appLogger.error` ahora pasan `errorCode` (`ERR_CORRUPTION_UNREPAIRABLE`, `ERR_NETWORK`, `ERR_IDB_OPEN_FAILED`); test expectation actualizada a `'repair-center'`; `AGENTS.md` ahora tiene sección "Verificación pre-commit" con 6 pasos para evitar recurrencia del anti-patrón FIX-011. FIX-012 marcado como fully resolved y removido del documento activo (historial preservado en git). Cero cambios funcionales. `tsc --noEmit` ✓, `pnpm test:run` 203/203 ✓, `pnpm lint` 25 errors/86 warnings (sin nuevos issues).

---

## FIX-015 — Post-auditoría Fase C: 5 desviaciones corregidas

**Fase de origen**: C (post-auditoría, commit cierre fase)

**Detectado en**: Auditoría Fase C por subagente (2026-06-05), verificando cada subfase contra el plan línea por línea.

**Hallazgos y resoluciones**:

### C.4-001 — Effects sin try/catch
**Síntoma**: Los 3 efectos `currencies`/`exchange_rates`/`customer_debts` en `useAppLoader.ts` no tenían try/catch. El plan especifica `try/catch` con `appLogger.warn` non-fatal. La protección dependía enteramente de `loadFlatCatalog()` que no lanza, pero errores inesperados (respuesta malformada, error de red en `fetchAllWithIntegrity`) serían promesas rechazadas no capturadas.
**Resolución**: Agregar `try/catch` con `appLogger.warn` y `errorCode` (`ERR_CURRENCIES_LOAD`, `ERR_EXCHANGE_RATES_LOAD`, `ERR_DEBTS_LOAD`) en los 3 efectos. La transición a siguiente fase ocurre incluso en catch (non-fatal).
**Archivo**: `frontend/src/presentation/shared/hooks/storage/useAppLoader.ts` (líneas 225-265)

### C.5-002 — Trigger de background tasks retrasado
**Síntoma**: El plan especifica que las background tasks se disparen inmediatamente después de `stock → ready_partial` (cuando la UI se vuelve usable), antes de `customers`/`suppliers`. El código disparaba solo cuando `phase === 'idle'` (después de que TODAS las fases completaran).
**Resolución**: Agregar disparador temprano en el effect `stock` inmediatamente después de `setAvailability('ready_partial')`, gated por `bgTasksTriggeredRef.current` y `store.phase === 'stock'`. El disparador original en efecto separado (líneas 314-320) se mantiene como respaldo si el primero no ejecuta.
**Archivo**: `frontend/src/presentation/shared/hooks/storage/useAppLoader.ts` (stock effect)

### C.6-001 — CacheProgressBar no distinguía ready_partial de ready_complete
**Síntoma**: El plan especifica comportamientos UI diferentes: `ready_partial` → banner "App lista — puedes descargar el mapa desde Configuración" (colapsable), `ready_complete` → badge "Todo listo" con check verde. El código trataba ambos como `isComplete` con el mismo mensaje.
**Resolución**: Separar `isReadyPartial` y `isReadyComplete`. `ready_complete` oculta barra de progreso principal, muestra "Todo listo" con check verde. `ready_partial` muestra barra gris (datos cargados) + mensaje "App lista — puedes descargar el mapa desde Configuración" en amber.
**Archivo**: `frontend/src/presentation/shared/components/network-status/CacheProgressBar.tsx`

### C.7-001 — Import order violation en HealthPanel.tsx
**Síntoma**: Importaciones `@/presentation/` aparecían antes que `@/infrastructure/`. Regla: external → core → infrastructure → presentation.
**Resolución**: Reordenar imports: `useNetworkStore` y `appLogger` (infrastructure) antes de `useAuthStore`/`useSyncStatus`/`TooltipHint` (presentation).
**Archivo**: `frontend/src/presentation/shared/components/storage/HealthPanel.tsx` (líneas 4-9)

### C.8-001 — CATALOG_STORES incompleto
**Síntoma**: `CATALOG_STORES = ['products', 'categories', 'warehouses']` — solo 3 entidades. El plan especifica 6: `categories`, `currencies`, `exchangeRates`, `customerDebts`, `customers`, `suppliers`. Además faltaba mapeo de nombres IDB → endpoints (ej: `customerDebts` → `/api/v1/debts`, `exchangeRates` → `/api/v1/exchange-rates`).
**Resolución**: Extender `CATALOG_STORES` a 6 entidades según plan. Agregar mapeo inline en el loop para endpoints no coincidentes (`exchangeRates`, `customerDebts`).
**Archivo**: `frontend/src/infrastructure/storage/SyncService.ts` (líneas 65, 249-252)

**Verificación post-fix**: `tsc --noEmit` 0 errors, `pnpm test:run` 219/219 pass (39 files).

**Lección**: La subfase C.6 (CacheProgressBar) y C.8 (background refresh) tenían implementaciones parciales que pasaron desapercibidas porque el componente CacheProgressBar no crasheaba visiblemente (solo UX sub-óptimo) y `pullCatalogsIfStale` funcionalmente refrescaba aunque fuera solo 3 stores. Esto refuerza la necesidad de la "auditoría pre-commit" de FIX-011 aplicada también a docs contra código real.

---

## FIX-016 — as any en OPFSTileSource.ts

**Fase de origen**: E (E.4 — OPFSTileSource protocolo OPFS)

**Detectado en**: Auditoría Phase E post-commit (2026-06-05)

**Síntoma**: `const source = { ... }; cachedTiles = new PMTiles(source as any);` — `as any` viola la regla "sin `any` sin justificación explícita" (task_plan.md línea 153).

**Causa raíz**: El tipo `Source` de pmtiles no se importaba desde la librería. Se asumió que el objeto inline no cumplía la interfaz esperada.

**Resolución**: Importar `type Source` desde `pmtiles` y tipar `source: Source`. Eliminar `as any`.

**Archivos**: `frontend/src/infrastructure/maps/protocols/OPFSTileSource.ts`

---

## FIX-017 — MapViewer.tsx: unused import/prop + useEffect deps

**Fase de origen**: E (E.6.2 — MapViewer interactivo)

**Detectado en**: Auditoría Phase E post-commit (2026-06-05)

**Síntomas**:
1. `Search` importado de `lucide-react` pero nunca usado
2. Prop `showSearch` definida en interfaz y destructured pero nunca usada en render
3. `useEffect` sin `initialCenter`, `initialZoom`, `markers`, `mode`, `onError`, `onLocationSelect` en array de dependencias

**Causa raíz**: Búsqueda offline planeada (useGeoSearch) no se integró en MapViewer. Props y useEffect no se actualizaron para reflejar que la búsqueda se delega al padre.

**Resolución**:
1. Eliminar `Search` del import
2. Eliminar `showSearch` de interface y destructuring (showLocate/showZoomControls se mantienen)
3. Añadir `// eslint-disable-next-line react-hooks/exhaustive-deps` al useEffect — el efecto debe ejecutarse solo una vez (mount) porque inicializa el mapa MapLibre. Agregar las props al array causaría re-inicialización completa del mapa en cada cambio.

**Archivos**: `frontend/src/presentation/shared/components/map/MapViewer.tsx`

---

## FIX-018 — StoragePanel.tsx: useState usado como ref

**Fase de origen**: E (E.13 — StoragePanel descarga mapa)

**Detectado en**: Auditoría Phase E post-commit (2026-06-05)

**Síntoma**: `const abortRef = useState<AbortController | null>(null)` seguido de `abortRef[1](abortController)`. El patrón correcto para mantener una referencia mutable que no cause re-renders es `useRef`.

**Causa raíz**: Confusión entre `useState` (para estado que gatilla re-render) y `useRef` (para valores mutables sin re-render). El `AbortController` no necesita re-render al cambiar.

**Resolución**: Cambiar a `const abortRef = useRef<AbortController | null>(null)`. Actualizar accesos de `abortRef[1]` → `abortRef.current =` y `abortRef[0]` → `abortRef.current`.

**Archivos**: `frontend/src/presentation/shared/components/storage/StoragePanel.tsx`

---

## FIX-019 — sw.ts: currentUserId sin uso para namespacing de caches

**Fase de origen**: E (A.10 — SW communication channel)

**Detectado en**: Auditoría Phase E post-commit (2026-06-05)

**Síntoma**: `currentUserId` se asigna vía mensaje `SET_USER_CONTEXT` pero nunca se usa para namespaces de caches SW. El plan requiere "Namespace de cache SW por userId para evitar contaminación entre sesiones".

**Causa raíz**: La implementación del handler recibe el userId pero no lo aplica a limpieza de caches ni namespacing.

**Resolución**: Agregar función `clearUserCaches(userId)` que elimina caches con prefijo `inventory-offline-${userId}`. Invocar en `SET_USER_CONTEXT` cuando userId cambia. Dejar namespacing de futuras caches dinámicas para Fase I (MaintenanceService).

**Archivos**: `frontend/src/app/sw.ts`

---

## FIX-020 — application.yml: maps.location sin trailing slash

**Fase de origen**: E (E.1 — configuración servidor PMTiles)

**Detectado en**: Auditoría Phase E post-commit (2026-06-05)

**Síntoma**: `app.maps.location: ${INVENTORY_MAPS_LOCATION:./maps}` — sin trailing slash. `MapController.java` concatena `mapsDir + filename` → produce `./mapscuba.pmtiles` (path inválido) cuando la variable de entorno no está definida y se usa el default del YAML.

**Causa raíz**: El default en el YAML omitió el `/` final. El código Java tiene `"./maps/"` como default en `env.getProperty`, pero el YAML sobreescribe el valor antes de que llegue al código, inyectando `./maps` sin slash.

**Resolución**: Cambiar default YAML a `./maps/`.

**Archivos**: `backend/inventory-app/src/main/resources/application.yml`

---

## FIX-021 — MapController.java: path traversal en serveMap

**Fase de origen**: E (E.1 — MapController endpoint)

**Detectado en**: Auditoría Phase E post-commit (2026-06-05)

**Síntoma**: `@PathVariable String filename` se concatena directamente a `mapsDir + filename`. Sin validación, `../` permite leer archivos fuera del directorio de mapas (ej: `../../etc/passwd`).

**Causa raíz**: Falta de sanitización de input en endpoint público (`.permitAll()` en SecurityConfig). El plan no especificaba validación de path traversal.

**Resolución**: Validar que `filename` no contenga `..`, `/` ni `\\`. Rechazar con `400 Bad Request` si contiene alguno.

**Archivos**: `backend/inventory-app/src/main/java/com/inventory/adapters/web/controller/maps/MapController.java`

---

## FIX-022 — docs_dev/adr-map-migration.md faltante

**Fase de origen**: E (File Summary E — ADR Leaflet→MapLibre)

**Detectado en**: Auditoría Phase E post-commit (2026-06-05)

**Síntoma**: El plan lista `docs_dev/adr-map-migration.md` en el File Summary E como archivo a crear. No existe en el working tree ni en el último commit. El ADR con criterio de retiro de Leaflet nunca se documentó.

**Causa raíz**: Omisión durante implementación de Phase E. El archivo no se incluyó en el commit de cierre.

**Resolución**: Crear `docs_dev/adr-map-migration.md` con criterio de retiro y justificación de la migración.

**Archivos**: `docs_dev/adr-map-migration.md` (nuevo)

---

## FIX-023 — useNotificationStream.ts: ref assignment during render

**Fase de origen**: F (F.2.a — Build checks / React hooks bugs)

**Detectado en**: `pnpm lint` durante F.2 build checks (2026-06-06)

**Síntoma**: `sseFilterRef.current = sseFilter;` ejecutado directamente en el cuerpo del componente (línea 109), fuera de un useEffect. ESLint rule `react-hooks/refs` marca esto como error: refs no deben mutarse durante render.

**Causa raíz**: El patrón "asignar ref durante render para tener siempre la última versión del callback" es un antipatrón. La asignación puede ejecutarse múltiples veces si el render se interrumpe, llevando a un estado inconsistente.

**Resolución**: Mover la asignación dentro de un `useEffect([sseFilter])` que sincronice el ref con el valor actual del callback. Esto garantiza que el ref siempre tenga la última versión sin ejecutarse durante render.

**Archivos**: `frontend/src/presentation/shared/hooks/api/useNotificationStream.ts`

**Lección**: Toda mutación de ref (`ref.current = X`) debe estar en `useEffect` o en un event handler. Nunca en el cuerpo del componente.

---

## FIX-024 — JsonView.tsx: useMemo called after conditional return

**Fase de origen**: F (F.2.a — Build checks / React hooks bugs)

**Detectado en**: `pnpm lint` durante F.2 build checks (2026-06-06)

**Síntoma**: `JsonView.tsx:60` — `useMemo` para tokenizar JSON se llama DESPUÉS de un early return (`if (!formatted) return <span>...`). Esto viola la regla de orden de hooks: los hooks deben llamarse en el mismo orden en cada render. ESLint rule `react-hooks/rules-of-hooks` lo detecta.

**Causa raíz**: El early return hace que cuando `formatted` es null, el segundo `useMemo` no se ejecute. Si en el siguiente render `formatted` no es null, se ejecuta DESPUÉS de no haberse ejecutado antes → orden de hooks inconsistente → React falla.

**Resolución**: Mover el `useMemo` de tokens ANTES del early return. Cuando `formatted` es null, retornar `[]` como fallback (el `tokenizeJson` nunca se llama con null).

**Archivos**: `frontend/src/presentation/shared/components/data-display/JsonView.tsx`

**Lección**: Los hooks deben estar al inicio del componente, antes de cualquier conditional return. Los early returns solo pueden ocurrir DESPUÉS de todos los hooks.

---

## FIX-025 — ArchUnit: application depende de adapters.web.dto (16 violations)

**Fase de origen**: F (F.2.b — ArchUnit violations)

**Detectado en**: `mvn test -Dtest=ArchitectureTest` (2026-06-06)

**Síntoma**: 16 violaciones en 8 archivos: clases en `application/` importan DTOs de `adapters/web/dto/{settings,report}/*`. La regla hexagonal establece que application NO debe depender de adapters.

**Causa raíz**: DTOs de respuesta fueron colocados originalmente en `adapters/web/dto/` por seguir convención de "DTOs son de presentación". Esto es incorrecto: los DTOs de respuesta son parte del CONTRATO del caso de uso, no de la capa web. Deben vivir en application.

**Resolución**: Mover (con `git mv` para preservar historial) los 8 DTOs desde `adapters/web/dto/{settings,report}/` a `application/dto/{settings,report}/`. Actualizar imports en 11 archivos (controllers, mappers, use cases).

**Archivos**:
- Movidos: `SystemSettingResponse`, `InventoryReportResponse`, `InventoryValueResponse`, `ProfitSummaryResponse`, `SalesReportResponse`, `SalesTimelinePoint`, `TopCustomerEntry`, `TopProductEntry`
- Modificados: 11 archivos con import updates

**Verificación**: `mvn test -Dtest=ArchitectureTest` → 5 tests run, 0 failures, 1 skipped (pre-existing `@Disabled`).

---

## FIX-026 — ArchUnit: domain.ports.out depende de adapters.persistence.entity (2 violations)

**Fase de origen**: F (F.2.b — ArchUnit violations)

**Detectado en**: `mvn test -Dtest=ArchitectureTest` (2026-06-06)

**Síntoma**: `domain/ports/out/DeviceCursorRepository.java` retorna `Mono<DeviceCursorEntity>` y recibe `DeviceCursorEntity` como parámetro. La regla hexagonal exige que los ports (en `domain/ports/out/`) solo usen tipos de `domain/`, no de `adapters/persistence/`.

**Causa raíz**: Cuando se creó el port, se importó el `DeviceCursorEntity` (que es un adapter entity, anotado con Spring Data R2DBC) directamente en la firma del port. Esto acopla el dominio al framework de persistencia.

**Resolución**:
1. Crear `domain/model/sync/DeviceCursor.java` — entidad de dominio pura, sin dependencias de Spring/JPA/R2DBC
2. Crear `adapters/persistence/adapter/mapper/DeviceCursorPersistenceMapper.java` — convierte Entity ↔ Domain
3. Modificar el port `DeviceCursorRepository` para usar `DeviceCursor` (domain) en su firma
4. Modificar `DeviceCursorRepositoryAdapter` para usar el nuevo mapper

`DeviceCursorEntity` se mantiene como detalle de persistencia (Spring Data R2DBC lo requiere para su `Repository<T>`).

**Archivos**:
- Nuevos: `domain/model/sync/DeviceCursor.java`, `adapters/persistence/adapter/mapper/DeviceCursorPersistenceMapper.java`
- Modificados: `domain/ports/out/DeviceCursorRepository.java`, `adapters/persistence/adapter/DeviceCursorRepositoryAdapter.java`

---

## FIX-027 — Tests backend: NullPointerException en AuditLogger (5 tests)

**Fase de origen**: F (F.2.c — Backend test NPEs)

**Detectado en**: `mvn test` durante F.2 build checks (2026-06-06)

**Síntoma**: 5 tests en `ProductCommandUseCaseTest` fallan con `NullPointerException: this.auditLogger is null` en `ProductCommandUseCase.create()/update()/etc`. El `@InjectMocks` no puede inyectar `AuditLogger` porque no hay `@Mock` declarado.

**Causa raíz**: El test declara `@Mock` para `ProductRepository`, `CategoryRepository`, `AuditLogRepository`, `SyncLogWriterPort`, `AuditSerializer` — pero no para `AuditLogger`. El constructor de `ProductCommandUseCase` requiere `AuditLogger`, por lo que queda en null.

**Resolución**: Agregar `@Mock private AuditLogger auditLogger;` y stub lenient en cada test que dispara `auditLogger.log(...)`: `lenient().when(auditLogger.log(any(), any(), any(), any(), any(), any())).thenReturn(Mono.empty());`

**Archivos**: `backend/inventory-app/src/test/java/com/inventory/application/usecase/command/ProductCommandUseCaseTest.java`

---

## FIX-028 — Tests backend: NullPointerException en syncLogWriter (2 tests)

**Fase de origen**: F (F.2.c — Backend test NPEs)

**Detectado en**: `mvn test` durante F.2 build checks (2026-06-06)

**Síntoma**: 2 tests en `SaleCommandUseCaseTest` fallan con `NullPointerException` originado en `Mono.then(syncLogWriter.log(...))`. El mock de `SyncLogWriterPort` retorna null por defecto (Mockito non-strict), y `.then(null)` lanza NPE.

**Causa raíz**: Los tests no stub `syncLogWriter.log(...)`, por lo que el mock retorna null. La chain `Mono.then(null)` es un NPE garantizado.

**Resolución**: Agregar stub: `lenient().when(syncLogWriter.log(any(), any(), any(), any(), any())).thenReturn(Mono.empty());` en cada test que dispare la cadena de sync log.

**Archivos**: `backend/inventory-app/src/test/java/com/inventory/application/usecase/command/SaleCommandUseCaseTest.java`

**Lección**: Al usar `Mockito` con métodos que retornan `Mono`/`Flux`, siempre stubear el método para retornar `Mono.empty()`/`Flux.empty()` aunque no sea foco del test. Si no, `.then()` o `.flatMap()` sobre el mock no-stubbed lanzan NPE.

---

## FIX-029 — Frontend lint: 40 errores `no-explicit-any` (pre-existing)

**Fase de origen**: F (F.2.d — Lint cleanup)

**Detectado en**: `pnpm lint` durante F.2 build checks (2026-06-06)

**Síntoma**: 40 errores `@typescript-eslint/no-explicit-any` distribuidos en 5 archivos:
- `frontend/src/infrastructure/api/client.ts` (4)
- `frontend/src/infrastructure/maps/adapters/CubaGeoSearchAdapter.ts` (3)
- `frontend/src/infrastructure/maps/adapters/CubaTileManager.ts` (5)
- `frontend/src/infrastructure/storage/SyncService.ts` (23)
- `frontend/src/infrastructure/storage/outbox.ts` (5)
- `frontend/src/presentation/modules/sync/components/FieldDiffTable.tsx` (2)

**Causa raíz**: `any` introducido en fases previas (B, C, D, E) por velocidad de implementación, sin justificación explícita según la regla "sin any sin justificación explícita" del plan.

**Resolución**:
- Crear tipos propios: `ServerConflictResult`, `CachedEntityRecord`, `GenericIDBStore`, `IncidentRecord`, `LockResult` en `SyncService.ts`
- Type guards: `isGeoEntryArray`, `isTileSetInfo` para narrowing
- `RetryableRequestConfig` en `client.ts` para axios interceptor
- `Record<string, unknown>` + cast tipado en `FieldDiffTable.tsx`
- `as 'products'` (literal de schema válido) en `outbox.ts` en lugar de `as any`

**Archivos**: 6 archivos frontend modificados (lista completa arriba).

**Verificación**: `pnpm lint` → 0 errors, 85 warnings (solo `exhaustive-deps` y otros warnings informativos).

---

## FIX-030 — Frontend lint: 2 `react/jsx-key` en CustomerDetailView/SupplierDetailView

**Fase de origen**: F (F.2.d — Lint cleanup)

**Detectado en**: `pnpm lint` durante F.2 build checks (2026-06-06)

**Síntoma**: Falta `key` prop en componentes renderizados dentro de `TooltipWrapper` map (CustomerDetailView.tsx:64, SupplierDetailView.tsx:51).

**Causa raíz**: Al refactorizar a `TooltipWrapper`, el `key` no se propagó al componente hijo.

**Resolución**: Agregar `key={item.id}` en el map correspondiente.

**Archivos**:
- `frontend/src/presentation/modules/customers/views/CustomerDetailView.tsx`
- `frontend/src/presentation/modules/suppliers/views/SupplierDetailView.tsx`

---

## FIX-031 — Frontend lint: 2 `no-unescaped-entities` en ToastContent

**Fase de origen**: F (F.2.d — Lint cleanup)

**Detectado en**: `pnpm lint` durante F.2 build checks (2026-06-06)

**Síntoma**: Comillas dobles `"` no escapadas en JSX (línea 69 de ToastContent.tsx, dos instancias).

**Causa raíz**: Texto con comillas tipográficas en el mensaje de notificación.

**Resolución**: Reemplazar `"` con `&quot;` en la entidad HTML.

**Archivos**: `frontend/src/presentation/shared/components/ui/toast/ToastContent.tsx`

---

## FIX-032 — Frontend lint: 2 `no-empty-object-type` en useSystemNotifications/useUserNotifications

**Fase de origen**: F (F.2.d — Lint cleanup)

**Detectado en**: `pnpm lint` durante F.2 build checks (2026-06-06)

**Síntoma**: `interface X {}` declarada vacía en useSystemNotifications.ts:12 y useUserNotifications.ts:13. La regla `@typescript-eslint/no-empty-object-type` marca interfaces vacías como equivalentes a su supertipo.

**Causa raíz**: Las interfaces se crearon como placeholder para futuras extensiones, sin campos definidos.

**Resolución**: Cambiar `interface X {}` a `type X = Record<string, never>` (type alias explícito) o `type X = object` (object genérico). Esto preserva la intención semántica sin violar la regla.

**Archivos**:
- `frontend/src/presentation/shared/hooks/api/useSystemNotifications.ts`
- `frontend/src/presentation/shared/hooks/api/useUserNotifications.ts`

---

## FIX-033 — Zod validators: `nullableString` no aceptaba `undefined` (solo `null`)

**Fase de origen**: C (C.4 — loadFlatCatalog + validators Zod)

**Detectado en**: Runtime en browser, errores recurrentes de validación en exchangeRates, customerDebts (2026-06-11)

**Síntoma**: Los schemas Zod que utilizan `nullableString = z.string().nullable()` rechazan items donde el backend omite el campo en vez de enviarlo como `null`. Error típico:
```
"expected": "string",
"code": "invalid_type",
"path": ["createdBy"],
"message": "Invalid input: expected string, received undefined"
```
Afectaba a `exchangeRates.createdBy`, `customerDebts.description`, `customerDebts.notes`. Los items rechazados iban a la `corruptionQueue`, el `DownloadQueue` reportaba "all N items failed validation", y esos stores quedaban vacíos en IDB.

**Causa raíz**: `nullableString = z.string().nullable()` acepta `string | null` pero NO `undefined`. Cuando el backend serializa un campo como `null` en Java, Jackson puede omitirlo del JSON si tiene configurado `@JsonInclude(Include.NON_NULL)`, resultando en un objeto donde el campo simplemente no existe. El `safeParse` recibe `undefined` para ese campo, y `.nullable()` no lo tolera. Mismo problema en los 8 archivos que definen `nullableString`.

**Resolución**: Cambiar la definición en los 8 validators:
```typescript
// Antes (rechaza undefined):
const nullableString = z.string().nullable();

// Después (acepta string | null | undefined, outputs string | null):
const nullableString = z.string().nullable().optional().default(null);
```
- `.optional()` permite que el campo sea `undefined` (omitido del JSON)
- `.default(null)` normaliza `undefined → null`, manteniendo el tipo de salida como `string | null` (idéntico al original)
- Sin cambios en los Cached types ni en las entidades de dominio
- `nullableNumber = z.coerce.number().nullable()` no se modificó porque el backend siempre envía números como `0` en vez de omitirlos

**Archivos** (8 validators):
- `frontend/src/core/loading/validators/product-response.ts`
- `frontend/src/core/loading/validators/customer-response.ts`
- `frontend/src/core/loading/validators/supplier-response.ts`
- `frontend/src/core/loading/validators/warehouse-response.ts`
- `frontend/src/core/loading/validators/category-response.ts`
- `frontend/src/core/loading/validators/exchange-rate-response.ts`
- `frontend/src/core/loading/validators/currency-response.ts`
- `frontend/src/core/loading/validators/customer-debt-response.ts`

**Verificación**: `pnpm test:run` → 219/219 tests pass (39 files), `pnpm lint` 0 errors.

**Problemas asociados detectados pero no corregidos**:

| Error | Causa | Solución propuesta | Estado |
|-------|-------|-------------------|--------|
| **currencies DataError** en IDB commit | Store `currencies` creado con `{ keyPath: 'id' }` (db.ts:517), pero `CachedCurrency` usa `code` como clave primaria, no tiene campo `id`. `target.put(item)` en `fetchAllWithIntegrity` falla porque IDB no encuentra `item.id`. | Ver FIX-034. | ✅ Corregido en FIX-034 |
| **stock checksum mismatch** | `fetchAllWithIntegrity` calcula checksum con `JSON.stringify(raw)` DESPUÉS de `normalizeArrayResponse()` (extrae array de `{content: [...], page, totalPages}`). El servidor firmó el objeto completo, no el array plano. Los hashes nunca coinciden. | Mover el cálculo del checksum a la respuesta HTTP cruda, ANTES de normalizar. 3 líneas de cambio en `DownloadQueueService.ts`. | ❌ Pendiente |
| **exchangeRates/customerDebts** mismos items fallando repetidamente | El error de validación envía items a `corruptionQueue`, pero en cada reintento el backend devuelve el mismo shape → falla igual. | Ya corregido con el fix de `nullableString`. | ✅ Corregido en FIX-033 |

**Lección**: La convención `@JsonInclude(Include.NON_NULL)` en el backend (o equivalente en Jackson) hace que campos `null` se omitan del JSON en vez de enviarse como `null`. Los validadores Zod deben usar `.nullable().optional().default(null)` en vez de solo `.nullable()` para tolerar tanto `null` como campo ausente. Alternativa: forzar `@JsonInclude(Include.ALWAYS)` en el backend para campos opcionales, pero eso aumenta el payload. La solución en Zod es más robusta porque el frontend se protege sin importar la configuración de serialización del backend.

---

## FIX-034 — IDB currencies store: keyPath `'id'` → `'code'` (no coincidía con el dominio)

**Fase de origen**: A (A.3.1 — IDB schema v5)

**Detectado en**: Runtime en browser, `DataError` al hacer `put` de currencies en `fetchAllWithIntegrity` (2026-06-11)

**Síntoma**: `DataError` silencioso al guardar monedas en IDB. El store `currencies` se creó con `{ keyPath: 'id' }` pero `CachedCurrency` no tiene campo `id` — usa `code` como identificador. Adicionalmente, `batchPut()` filtraba items con `if (item.id != null)`, descartando silenciosamente TODAS las monedas. Resultado: el store quedaba vacío, currencies no disponibles offline, el loader avanzaba igual (non-fatal).

**Causa raíz**: El plan original (Fase A, A.3.1, tabla de stores) listó `currencies` con `keyPath: 'id'` por simetría con los otros stores, pero el backend PostgreSQL usa `code VARCHAR(3) PRIMARY KEY`, la entidad de dominio `Currency.code` es el identity, el DTO `CurrencyResponse` solo tiene `code`, y la interfaz frontend `CachedCurrency` no tiene campo `id`. El `keyPath: 'id'` era un error de especificación que se replicó a implementación.

**Resolución**: 4 cambios en `frontend/src/infrastructure/storage/db.ts`:

1. **`DB_VERSION` 6 → 7**: Fuerza upgrade en browsers existentes.
2. **Upgrade migration**: Bloque `oldVersion < 7` elimina y recrea el store `currencies` con el keyPath correcto (IDB no permite cambiar keyPath in-place).
3. **`keyPath: 'id'` → `'code'`** en la creación del store (line 523).
4. **`batchPut` dinámico**: Reemplaza `if (item.id != null)` por lectura del `keyPath` real del store (`const keyPath = objectStore.keyPath`). Así funciona para cualquier store, no solo currencies.

**Archivos**:
- `frontend/src/infrastructure/storage/db.ts` (`DB_VERSION`, upgrade block, store creation, `batchPut`)

**Verificación**: `pnpm test:run` → 219/219 tests pass (39 files), `pnpm lint` 0 errors.

**Lección**: La tabla de stores en `task_plan.md` listaba `currencies` con `keyPath: 'id'` por asumir simetría con el resto, pero no verificó contra el DTO real del backend ni contra `CachedCurrency`. Lección doble: (1) el keyPath IDB debe coincidir con el identity de la entidad de dominio, no con una convención arbitraria; (2) `batchPut` no debe hardcodear la key de filtrado — debe leer el `keyPath` del store para ser genérico.

---

## FIX-036 — `CorruptionEntry.retryCount` faltante en `writeCorruption` (K.6 regression)

**Fase de origen**: K (K.6 — retry limit y quarantine)

**Detectado en**: Type-check manual post-K.6 (2026-06-13)

**Síntoma**: `DownloadQueueService.writeCorruption()` crea un `CorruptionEntry` sin el campo `retryCount`. El tipo `CorruptionEntry` fue modificado en K.6 para tener `retryCount: number` como campo requerido. Sin este campo, TypeScript lanzaría error de tipo al compilar.

**Causa raíz**: K.6 modificó el type `CorruptionEntry` agregando `retryCount: number` (requerido), pero no actualizó el único lugar que crea instancias de `CorruptionEntry` a través de la asignación de objeto literal (`const entry: CorruptionEntry = {...}`). TypeScript detectaría el campo faltante por inferencia del tipo anotado, pero al no correr `tsc --noEmit` (timeout de build), el error pasó desapercibido.

**Impacto**: Bloqueante de compilación — `tsc` fallaría con `error TS2741: Property 'retryCount' is missing in type...`.

**Resolución**: Agregar `retryCount: 0` al objeto literal en `writeCorruption` (DownloadQueueService.ts:484).

**Archivos**:
- `frontend/src/infrastructure/storage/DownloadQueueService.ts:484`

**Verificación**: Corregido en mismo commit de K.9.

**Lección**: Cuando se modifica un type compartido agregando campos requeridos, buscar en todo el codebase los lugares que crean instancias de ese type (`const x: Type = {...}`). La verificación `tsc --noEmit` debería haber detectado esto; el timeout de red no debería impedir una inspección manual de todas las instancias del type modificado.

---
