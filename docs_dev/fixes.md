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

**Resultado B.1**: `tsc --noEmit` ✓, `pnpm test:run` 194/194 ✓, lint sin nuevos warnings en archivos de B.1. Los 25 errores / 86 warnings de `pnpm lint` son pre-existentes en archivos no tocados por B.1 (componentes UI de presentation/, etc.) y quedan fuera del scope.

**Resultado B.3 + B.4.5** (commit f94069e): `mvn compile` ✓, `mvn test` 102/102 (17 fallos pre-existentes en `ProductControllerTest`/`ProductCommandUseCaseTest`/`SaleCommandUseCaseTest`/`ArchitectureTest` no relacionados con esta subfase — son bugs en `mockUser()` que no incluye roles, y en ArchUnit que asume `domain` libre de Spring/Jackson).

**Resultado B.6** (este commit): working tree restaurado a invariantes B.1. `tsc --noEmit` ✓ (revisado contra HEAD limpio).

---

*Documento generado durante preparación de Fase B el 2026-06-04; ampliado con FIX-007/008/009/010 al cierre de B.1, FIX-011 al cierre de B.6.*
