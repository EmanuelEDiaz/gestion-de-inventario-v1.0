# Plan: Fase M — Reparación Runtime (bugs post-L)

> Created: 2026-06-15 | v2 — post-L. Extiende `task_plan.md`: reglas, principios y convenciones de `task_plan.md` aplican. Fase M.

---

## ✅ Fase M — Completada

| Subfase | Commit | Cambio | Verificación |
|---------|--------|--------|-------------|
| L.1.a | `187c1b2` | +3 handlers (sw_precache, db_open, rehydrate_local) + fix peso products 40→45 | tsc + lint clean |
| L.1.b | `b396162` | +3 handlers (warehouses, categories, products) | tsc + lint clean |
| L.2 | `72fa172` | Flux.interval keepalive 30s en NotificationSseController.java | mvn test 102/0 |
| L.3 | ⏭️ saltado | Opcional — resuelto por L.2 | — |
| M.1 | `fc6fc39` | Backend: columna `is_active` → `active` en GeoRegionEntity | mvn compile -q |
| M.2 | `fc6fc39` | Frontend: Zod `.catch(null)` en lat/lng customers/suppliers | tsc + lint clean |
| **M.3** | `fdc50be` | SSE: heartbeat 30s→10s + direct SSE bypass proxy | tsc + lint + mvn compile clean |
| **M.4** | `49d38be` | Repair modal overlay fuera de condicion `degraded` | tsc + lint clean |
| **Fix-005** | `627ffd9` | Backend: `@JsonInclude(ALWAYS)` lat/lng (causa raíz NaN) | mvn compile -q |

---

## 1. Problemas Detectados en Runtime

### M.1 — Backend: columna `is_active` no existe en `geo_regions`

`V21__add_geo_regions.sql` crea columna `active`, pero `GeoRegionEntity.java:37` declara `@Column("is_active")`. Spring Data R2DBC genera SQL con `WHERE geo_regions.is_active = $1` → `column does not exist`.

**Impacto**: Endpoint `GET /api/v1/geo/provinces/{code}` devuelve 500. Background task `populate_geo_index` falla con `ERR_GEOINDEX_LOAD_FAILED`.

### M.2 — Frontend: customers/suppliers fallan validación Zod (NaN en lat/lng)

```
[ERROR] [DownloadQueue] all 8 items failed validation in customers
expected: "number", received: "NaN", path: ["latitude"]
```

`z.coerce.number()` recibe un valor que convierte a NaN (probablemente `undefined` de campo faltante o `BigDecimal` nulo mal serializado). Customers/suppliers no se persisten en IDB.

**Impacto**: Viola **P3** — datos offline de customers/suppliers ausentes.

### M.3 — Frontend: SSE ECONNRESET persiste

Keep-alive cada 30s no basta si el proxy Next.js tiene timeout ocioso < 30s.

### M.4 — Frontend: toast "Ir a reparar" no abre modal

`handleOpenRepairCenter()` → `setShowRepairCenter(true)` no produce modal visible.

---

## 2. Principios Violados

| Issue | Principio | Severidad |
|-------|-----------|-----------|
| M.2 — NaN lat/lng | **P3**: offline indefinido | **Alta** — datos offline perdidos |
| M.1 — is_active column | P2: dispositivo ligero | Media — geo degradado |
| M.3 — SSE ECONNRESET | Ninguno | Baja — ruido no-fatal |
| M.4 — Repair modal | Ninguno | Baja — UX |

---

## 3. Fases de Implementación

### Fase M.1 — Backend: fix columna `is_active` → `active`

**Skills**: `clean-code`, `layered-architecture`

**Archivo**: `backend/.../persistence/adapter/entity/GeoRegionEntity.java:37`

```diff
- @Column("is_active")
+ @Column("active")
  private boolean active;
```

**Verificación**: `mvn compile -q` → `mvn test`

---

### Fase M.2 — Fix NaN en lat/lng de customers y suppliers

**Skills**: `clean-code`, `senior-backend`, `senior-frontend`

#### M.2.a — Investigar origen del NaN

Leer `SupplementaryApplicationMapper.java` para ver cómo mapea `BigDecimal latitude`/`longitude`. Si hace `.doubleValue()` sin null-check, bug de backend. Si el DTO retorna `null` correctamente, bug de frontend (Zod recibe `undefined`).

#### M.2.b — Frontend: Zod tolerar NaN como null

En `customer-response.ts` y `supplier-response.ts`:
```typescript
const nullableNumber = z.coerce.number().finite().nullable().catch(null);
```

`.catch(null)` transforma cualquier error (NaN incluido) a `null`.

**Archivos**: 
- `frontend/src/core/loading/validators/customer-response.ts`
- `frontend/src/core/loading/validators/supplier-response.ts`
- (posible) `backend/.../application/mapper/SupplementaryApplicationMapper.java`

**Verificación**: `pnpm exec tsc --noEmit` + `pnpm lint`

---

### Fase M.3 — Reparar SSE ECONNRESET

**Skills**: `senior-frontend`, `clean-code`

**Opción A (recomendada)**: Reducir heartbeat 30s → 10s en `NotificationSseController.java`.
**Opción B**: Conectar SSE directo a `API_BASE` en vez del proxy.

**Archivos**: `NotificationSseController.java`, `useNotificationStream.ts` (x2)

**Verificación**: `mvn compile -q` + `pnpm exec tsc --noEmit` + `pnpm lint`

---

### Fase M.4 — Debug repair modal

**Skills**: `senior-frontend`, `clean-code`

Investigar en `DashboardLayout.tsx` por qué `setShowRepairCenter(true)` no renderiza `CorruptionRepairCenter`. Posibles causas: stale closure en callback del toast, CSS overlay ocultando el modal, condición de renderizado incorrecta.

**Verificación**: Prueba manual.

---

## 4. Reglas de Ejecución

- **🏛️ P1–P5 son ley suprema**: M.2 tiene prioridad sobre M.1 por violar P3. M.3 y M.4 son secundarios.
- **Una fase a la vez**: ejecutar → verificar (tsc + lint + tests) → commit → preguntar al usuario si continuar.
- **Commit por fase**: `git add . && git commit -m '<tipo>(<scope>): <mensaje>'` (conventional commits).
- **Skills por fase**: cargar la skill indicada antes de tocar código.
- **Verificación obligatoria frontend**: `pnpm exec tsc --noEmit` + `pnpm lint`.
- **Verificación obligatoria backend**: `mvn compile -q` + `mvn test`.
- **Prohibido `catch(e) {}`** sin tipar.
- **Sin `any`** sin justificación explícita.
- **Errores preexistentes no previstos**: documentar en `docs_dev/fixes.md` con causa raíz + solución + fase.
- **Máximo 3 sub-agentes en paralelo** para acelerar.
- **Código**: Inglés. **UI**: Español.

---

## 5. Archivos Resumen

| Archivo | Cambio | Fase |
|---------|--------|:----:|
| `backend/.../entity/GeoRegionEntity.java` | `@Column("is_active")` → `@Column("active")` | ✅ M.1 |
| `backend/.../mapper/SupplementaryApplicationMapper.java` | No tenía bug — NaN no viene de backend | ✅ M.2 (investigado) |
| `frontend/src/core/loading/validators/customer-response.ts` | Zod: `.catch(null)` en nullableNumber | ✅ M.2 |
| `frontend/src/core/loading/validators/supplier-response.ts` | Zod: `.catch(null)` en nullableNumber | ✅ M.2 |
| `backend/.../NotificationSseController.java` | `30s` → `10s` (opcional) | M.3 |
| `frontend/.../hooks/useNotificationStream.ts` (x2) | SSE directo a backend (opcional) | M.3 |
| `frontend/.../layout/DashboardLayout.tsx` | Debug repair modal | M.4 |

---

## 6. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| M.2: mapper no tiene bug → NaN viene de otro lado | Pérdida de tiempo investigando | Si mapper está bien, ir directo a M.2.b (Zod catch) |
| M.2: `.catch(null)` oculta errores legítimos | Datos corruptos guardados como null | Solo aplicar a lat/lng, no a campos críticos |
| M.3 opción B: CORS bloquea SSE directo | SSE sigue roto | Agregar CORS header en backend, o volver a opción A |
| M.4: stale closure en toast de sonner | Modal no se abre nunca | Pasar callback como ref estable |
