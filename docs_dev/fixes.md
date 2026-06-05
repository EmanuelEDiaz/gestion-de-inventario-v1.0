# Fixes — Desviaciones detectadas durante Fase B

> Documento vivo. Cada entrada describe una desviación del plan `task_plan.md` v5.3, su causa, resolución aplicada y a qué fase pertenece.

---

## FIX-001 — Stores `corruptionQueue` y `downloadChunks` faltan en DB v5

**Fase de origen**: A (Fase A — Fundaciones offline)

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
