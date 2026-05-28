# Plan: Checkbox + Batch Delete en Tablas (Revisado)

> Created: 2026-05-22 v2 | Refinado tras auditoría de código real

## Reglas de Ejecución

- **Una fase a la vez**: ejecutar → verificar → preguntar al usuario si continuar
- **Verificación obligatoria**: `pnpm build` (frontend) + `mvn test -q` (backend)
- **UI**: Español (labels, tooltips, errores). **Código**: Inglés
- **Mobile-first**: Touch targets ≥44px, barra de selección responsive
- **Sin `any`** sin justificación explícita

---

## Auditoría Previa — Lo que realmente existe

| Aspecto | Estado |
|---------|--------|
| **GenericTable** props `selectable` + `onDeleteSelected` | ✅ Ya existen |
| **useTableSelection** hook | ✅ Ya existe |
| **Floating action bar** ("N seleccionado(s)" + "Eliminar" + "Cancelar") | ✅ Ya existe |
| **Vistas con selectable activado** | 3/12: Categories, Customers, Suppliers |
| **Backend batch DELETE endpoint** | ❌ No existe |
| **Frontend batch delete** | ❌ Usa `Promise.all(ids.map(delete))` — N requests |
| **ReactiveCrudRepository.deleteAllById** | ✅ Ya disponible en Spring Data R2DBC |

## Clasificación de Entidades (basada en código real)

| Entidad | Tiene hard delete? | Batch DELETE? | Complejidad |
|---------|-------------------|---------------|-------------|
| Category | ✅ Sí, con validación de productos asociados | ✅ | **Con validación** |
| Customer | ✅ Sí, sin validación | ✅ | Simple |
| Supplier | ✅ Sí, sin validación | ✅ | Simple |
| Product | ✅ Sí, con existencia check | ✅ | **Con validación** |
| Purchase | ✅ Sí, solo DRAFT | ✅ | **Con validación** |
| Sale | ✅ Sí, `canDelete()` del dominio | ✅ | **Con validación** |
| Transfer | ✅ Sí, `canDelete()` del dominio + cascade lines | ✅ | **Con validación** |
| Return | ✅ Sí, `canDelete()` + cascade lines | ✅ | **Con validación** |
| Adjustment | ✅ Sí, `canDelete()` + cascade lines | ✅ | **Con validación** |
| User | ❌ Soft (deactivate) | ❌ → Batch deactivate | Alternativo |
| Role | ❌ Soft (deactivate, system protegidos) | ❌ → Batch deactivate | Alternativo |
| Warehouse | ❌ Soft (deactivate) | ❌ → Batch deactivate | Alternativo |

---

## Arquitectura (respetando hexagonal)

### Backend — 5 capas por entidad

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Controller: @DeleteMapping("/batch")                     │
│    → llama a commandPort.deleteAll(ids)                     │
├─────────────────────────────────────────────────────────────┤
│ 2. Command Port (in): deleteAll(List<UUID> ids)             │
├─────────────────────────────────────────────────────────────┤
│ 3. Use Case: implementa deleteAll con validaciones          │
│    Simple: repository.deleteAllById(ids)                    │
│    Con validación: verifica cada ID antes de borrar         │
├─────────────────────────────────────────────────────────────┤
│ 4. Domain Repository Port (out): deleteAllById(List<UUID>)  │
├─────────────────────────────────────────────────────────────┤
│ 5. Persistence Adapter: r2dbcRepository.deleteAllById(ids)  │
└─────────────────────────────────────────────────────────────┘
```

### Frontend — 3 capas por entidad

```
┌──────────────────────────────────────────┐
│ 1. Repository Interface: deleteAll(ids)   │
├──────────────────────────────────────────┤
│ 2. Repository Impl: apiClient.delete()    │
├──────────────────────────────────────────┤
│ 3. View: reemplazar Promise.all → repo   │
└──────────────────────────────────────────┘
```

---

## Progreso

| Fase | Estado | Commit |
|------|--------|--------|
| **B0** — Auditoría y clasificación de entidades | ✅ Hecho | — |
| **B1** — Patrón canónico backend (definición) | ✅ Hecho | `b086313` |
| **B2** — Aplicar patrón backend (9 entidades) | ✅ Hecho | `b086313` |
| **F0** — GenericTable: bulkActions + responsive | ✅ Hecho | `2fb7125` |
| **F1** — Patrón canónico frontend (definición) | ✅ Hecho | `2fb7125` |
| **F2** — Aplicar patrón frontend (9 entidades + 3 soft) | ⏳ Pendiente | — |
| **R1** — Verificación responsive mobile | ⏳ Pendiente | — |

---

## Fase B1 — Patrón Canónico Backend

> Documentado UNA vez. Aplicado a 9 entidades en B2.

### 1. Domain Repository Port (`domain/ports/out/*Repository.java`)

Agregar:
```java
Mono<Void> deleteAllById(List<UUID> ids);
```

### 2. Inbound Command Port (`domain/ports/in/*/*CommandPort.java`)

Agregar:
```java
Mono<Void> deleteAll(List<UUID> ids);
```

### 3. Persistence Adapter (`adapters/persistence/adapter/*RepositoryAdapter.java`)

```java
@Override
public Mono<Void> deleteAllById(List<UUID> ids) {
    if (ids.isEmpty()) return Mono.empty();
    return r2dbcRepository.deleteAllById(ids);
}
```

### 4. Use Case — Dos variantes

**Variante Simple** (Customer, Supplier):
```java
@Override
public Mono<Void> deleteAll(List<UUID> ids) {
    if (ids.isEmpty()) return Mono.empty();
    return repository.deleteAllById(ids);
}
```

**Variante con validación** (Category, Product, Purchase, Sale, Transfer, Return, Adjustment):
- Verificar cada ID antes de borrar
- Si alguna falla validación → `Mono.error` (atómicamente, no borra ninguna)

```java
@Override
public Mono<Void> deleteAll(List<UUID> ids) {
    if (ids.isEmpty()) return Mono.empty();
    return Flux.fromIterable(ids)
        .flatMap(this::validateCanDelete)  // cada entidad implementa su validación
        .then(repository.deleteAllById(ids));
}
```

### 5. Controller (`adapters/web/controller/*/*Controller.java`)

```java
@DeleteMapping("/batch")
public Mono<Void> deleteBatch(@RequestBody List<UUID> ids) {
    return commandPort.deleteAll(ids);
}
```

### Detalle de validaciones por entidad

| Entidad | Validación previa | Comportamiento |
|---------|------------------|----------------|
| Category | `categoryRepository.countProducts(id)` > 0 → error | Atómico: si alguna falla, no borra ninguna |
| Product | `productRepository.existsById(id)` → false → error | Atómico |
| Purchase | `status != DRAFT` → error | Atómico |
| Sale | `!sale.canDelete()` → error | Atómico |
| Transfer | `!transfer.canDelete()` → error | Atómico |
| Return | `!ret.canDelete()` → error, cascade lines | Atómico |
| Adjustment | `!adj.canDelete()` → error, cascade lines | Atómico |
| Customer | Sin validación | Directo |
| Supplier | Sin validación | Directo |

---

## Fase B2 — Aplicar Patrón Backend (1 ejecución)

> Ejecutar como un solo batch. NO fase por entidad.

| Archivos a modificar | Cantidad |
|---------------------|----------|
| Domain repository ports | 9 (add `deleteAllById`) |
| Command ports | 7 (add `deleteAll`; Purchase, Return no revisados) |
| Persistence adapters | 9 (impl `deleteAllById`) |
| Use cases | 9 (impl `deleteAll` con o sin validación) |
| Controllers | 9 (add `@DeleteMapping("/batch")`) |
| **Total** | **~43 archivos** |

### Checklist por entidad

- [ ] `CategoryRepository.java` — add `deleteAllById`
- [ ] `CategoryCommandPort.java` — add `deleteAll`
- [ ] `CategoryRepositoryAdapter.java` — impl `deleteAllById`
- [ ] `CategoryCommandUseCase.java` — impl `deleteAll` con validación
- [ ] `CategoryController.java` — add endpoint
- [ ] `CustomerRepository.java` — add `deleteAllById`
- [ ] `CustomerCommandPort.java` — add `deleteAll`
- [ ] `CustomerRepositoryAdapter.java` — impl `deleteAllById`
- [ ] `CustomerCommandUseCase.java` — impl `deleteAll` simple
- [ ] `CustomerController.java` — add endpoint
- [ ] `SupplierRepository.java` — add `deleteAllById`
- [ ] `SupplierCommandPort.java` — add `deleteAll`
- [ ] `SupplierRepositoryAdapter.java` — impl `deleteAllById`
- [ ] `SupplierCommandUseCase.java` — impl `deleteAll` simple
- [ ] `SupplierController.java` — add endpoint
- [ ] `ProductRepository.java` — add `deleteAllById`
- [ ] `ProductCommandPort.java` — add `deleteAll`
- [ ] `ProductRepositoryAdapter.java` — impl `deleteAllById`
- [ ] `ProductCommandUseCase.java` — impl `deleteAll` con validación
- [ ] `ProductController.java` — add endpoint
- [ ] `PurchaseRepository.java` — add `deleteAllById` (nota: método se llama `delete`, no `deleteById`)
- [ ] PurchaseCommandPort — add `deleteAll`
- [ ] `PurchaseRepositoryAdapter.java` — impl `deleteAllById`
- [ ] `PurchaseCommandUseCase.java` — impl `deleteAll` con validación DRAFT
- [ ] `PurchaseController.java` — add endpoint
- [ ] `SaleRepository.java` — add `deleteAllById`
- [ ] `SaleCommandPort.java` — add `deleteAll`
- [ ] `SaleRepositoryAdapter.java` — impl `deleteAllById`
- [ ] `SaleCommandUseCase.java` — impl `deleteAll` con validación
- [ ] `SaleController.java` — add endpoint
- [ ] `TransferRepository.java` — add `deleteAllById`
- [ ] `TransferCommandPort.java` — add `deleteAll`
- [ ] `TransferRepositoryAdapter.java` — impl `deleteAllById`
- [ ] `TransferCommandUseCase.java` — impl `deleteAll` con validación + cascade
- [ ] `TransferController.java` — add endpoint
- [ ] `ReturnRepository.java` — add `deleteAllById`
- [ ] ReturnCommandPort — add `deleteAll`
- [ ] `ReturnRepositoryAdapter.java` — impl `deleteAllById`
- [ ] `ReturnCommandUseCase.java` — impl `deleteAll` con validación + cascade
- [ ] `ReturnController.java` — add endpoint
- [ ] `AdjustmentRepository.java` — add `deleteAllById`
- [ ] AdjustmentCommandPort — add `deleteAll`
- [ ] `AdjustmentRepositoryAdapter.java` — impl `deleteAllById`
- [ ] `AdjustmentCommandUseCase.java` — impl `deleteAll` con validación + cascade
- [ ] `AdjustmentController.java` — add endpoint

### Consideraciones especiales (leer antes de ejecutar)

1. **PurchaseRepository** — `delete(UUID id)` en lugar de `deleteById(UUID id)`. Agregar `deleteAllById` como método nuevo.
2. **Return, Adjustment, Transfer** — cascade explícito de líneas. `deleteAllById` debe replicar la lógica de borrar líneas hijas primero. `Flux.fromIterable(ids).flatMapSequential(this::deleteWithLines)`.
3. **Sale** — `sale.canDelete()` delega al modelo de dominio. La validación batch debe cargar cada Sale y llamar `canDelete()`.
4. **No tocar User, Role, Warehouse** — no tienen hard delete.

---

## Fase F0 — GenericTable: bulkActions + responsive

### F0.1 — Tipos `BulkAction`

En `GenericTable.tsx` o types existente:
```typescript
interface BulkAction<T> {
  label: string;
  variant?: 'default' | 'destructive' | 'outline';
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (ids: string[]) => void | Promise<void>;
  disabled?: (selectedIds: string[]) => boolean;
}
```

### F0.2 — Props `bulkActions` + `onSelectionChange`

```typescript
interface GenericTableProps<T> {
  // ... existentes
  selectable?: boolean;
  onDeleteSelected?: (ids: string[]) => void;
  bulkActions?: BulkAction<T>[];
  onSelectionChange?: (ids: string[]) => void;
}
```

### F0.3 — Renderizar bulk actions en la barra

La barra actual solo tiene "Eliminar seleccionados" + "Cancelar". Con `bulkActions`:
```
[Ícono] N seleccionado(s)    [BulkAction 1] [BulkAction 2] [Eliminar] [Cancelar]
```

### F0.4 — Responsive

```
Mobile ( <640px ):  flex-col gap-2, botones w-full, touch min-h-[44px]
Desktop (>=640px ): flex-row, botones w-auto, inline
```

---

## Fase F1 — Patrón Canónico Frontend

> Verificado contra código real. Patrón correcto. Aplicado a 9 entidades + 3 soft-delete en F2.

### 1. Repository Interface (`core/*/ports/I*Repository.ts`)

Agregar en las 9 interfaces (Products, Categories, Customers, Suppliers, Purchases, Sales, Transfers, Returns, Adjustments):
```typescript
deleteAll(ids: string[]): Promise<void>;
```
Soft-delete (Users, Roles, Warehouses) → **NO** agregar `deleteAll` (no tienen endpoint batch DELETE).

### 2. Repository Impl (`infrastructure/repositories/*/*Repository.ts`)

Agregar en los 9 repos:
```typescript
async deleteAll(ids: string[]): Promise<void> {
  await apiClient.delete(`${this.basePath}/batch`, { data: ids });
}
```
Nota: `axios.delete(url, { data: ids })` envía body en DELETE (válido con Axios, el backend Spring lee `@RequestBody List<UUID>`).

### 3. View — Reemplazar `Promise.all`

Buscar el patrón `Promise.all(ids.map(...))` en las vistas y hooks:

**Antes** (actual en Customers, Suppliers, Categories):
```typescript
await Promise.all(ids.map((id) => repository.delete(id)));
```

**Después**:
```typescript
await repository.deleteAll(ids);
```

### 4. Archivos específicos a modificar en F2

| Capa | Ruta | Acción |
|------|------|--------|
| Interface | `core/product/ports/IProductRepository.ts` | +`deleteAll` |
| Interface | `core/category/ports/ICategoryRepository.ts` | +`deleteAll` |
| Interface | `core/customer/ports/ICustomerRepository.ts` | +`deleteAll` |
| Interface | `core/supplier/ports/ISupplierRepository.ts` | +`deleteAll` |
| Interface | `core/purchase/ports/IPurchaseRepository.ts` | +`deleteAll` (si existe) |
| Interface | `core/sale/ports/ISaleRepository.ts` | +`deleteAll` (si existe) |
| Interface | `core/transfer/ports/ITransferRepository.ts` | +`deleteAll` (si existe) |
| Interface | `core/return/ports/IReturnRepository.ts` | +`deleteAll` (si existe) |
| Interface | `core/adjustment/ports/IAdjustmentRepository.ts` | +`deleteAll` (si existe) |
| Impl | `infrastructure/repositories/product/ProductRepository.ts` | +`deleteAll` |
| Impl | `infrastructure/repositories/category/CategoryRepository.ts` | +`deleteAll` |
| Impl | `infrastructure/repositories/customer/CustomerRepository.ts` | +`deleteAll` |
| Impl | `infrastructure/repositories/supplier/SupplierRepository.ts` | +`deleteAll` |
| Impl | `infrastructure/repositories/purchase/PurchaseRepository.ts` | +`deleteAll` |
| Impl | `infrastructure/repositories/sale/SaleRepository.ts` | +`deleteAll` |
| Impl | `infrastructure/repositories/transfer/TransferRepository.ts` | +`deleteAll` |
| Impl | `infrastructure/repositories/return/ReturnRepository.ts` | +`deleteAll` |
| Impl | `infrastructure/repositories/adjustment/AdjustmentRepository.ts` | +`deleteAll` |
| View/Hook | `modules/categories/views/CategoriesView.tsx` + `useCategoriesController.ts` | Swap → `deleteAll` |
| View | `modules/customers/views/CustomersListView.tsx` | Swap → `deleteAll` |
| View | `modules/suppliers/views/SuppliersListView.tsx` | Swap → `deleteAll` |
| View | Product view (donde esté `ProductTable.tsx`) | +`selectable` + `onDeleteSelected` |
| View | `modules/purchases/views/PurchasesView.tsx` (o similar) | +`selectable` |
| View | `modules/sales/views/SalesView.tsx` (o similar) | +`selectable` |
| View | Transfer view | +`selectable` |
| View | Return view | +`selectable` |
| View | Adjustment view | +`selectable` |

---

## Fase F2 — Aplicar Patrón Frontend

### Vistas que ya tienen selectable (solo migrar a batch):

| Vista | Archivo | Acción |
|-------|---------|--------|
| CategoriesView | `modules/categories/views/CategoriesView.tsx` | Swap impl + add `deleteAll` a repo |
| CustomersListView | `modules/customers/views/CustomersListView.tsx` | Swap impl + add `deleteAll` a repo |
| SuppliersListView | `modules/suppliers/views/SuppliersListView.tsx` | Swap impl + add `deleteAll` a repo |

### Vistas sin selectable (agregar desde cero):

| Vista | Archivo(s) | Acción |
|-------|-----------|--------|
| Products | `ProductRepository.ts`, `ProductTable.tsx` + contenedor | Add `deleteAll` a repo + add selectable a tabla |
| Purchases | `PurchaseRepository.ts`, `PurchaseTable.tsx` | Add `deleteAll` + selectable (solo DRAFT) |
| Sales | `SaleRepository.ts`, `SaleTable.tsx` | Add `deleteAll` + selectable |
| Transfers | `TransferRepository.ts`, `TransferTable.tsx` | Add `deleteAll` + selectable |
| Returns | `ReturnRepository.ts`, `ReturnTable.tsx` | Add `deleteAll` + selectable |
| Adjustments | `AdjustmentRepository.ts`, vista | Add `deleteAll` + selectable |

### Entidades soft-delete (bulkActions en lugar de delete):

| Vista | Archivo(s) | Acción |
|-------|-----------|--------|
| Users | `UserRepository.ts`, `UsersView.tsx` | Add `bulkActions` con "Activar"/"Desactivar" |
| Roles | `RoleRepository.ts`, `RolesView.tsx` | Add `bulkActions` — excluir system roles |
| Warehouses | `WarehouseRepository.ts`, `WarehousesListView.tsx` | Add `bulkActions` con "Activar"/"Desactivar" |

---

## Verificación Post-Fix

```bash
# 1. Backend: batch endpoints existen (9 entidades hard-delete)
rg '@DeleteMapping.*batch' backend/inventory-app/src/main/java/com/inventory/adapters/web/controller/ -l | wc -l
# Expected: 9

# 2. Frontend: deleteAll en repositorios
rg 'deleteAll' frontend/src/infrastructure/repositories/ -l | wc -l
# Expected: 9+

# 3. Frontend: selectable en tablas
rg 'selectable' frontend/src/presentation/modules/*/views/ -l | wc -l
# Expected: 9+ (Categories, Customers, Suppliers + nuevas)

# 4. Build frontend
cd frontend && pnpm build 2>&1 | tail -5

# 5. Backend compile + test
cd backend/inventory-app && mvn compile -q && mvn test -q 2>&1 | tail -3

# 6. Frontend tests
cd frontend && pnpm test:run 2>&1 | tail -5

# 7. Sin any type sin justificación
rg '\bany\b' frontend/src/presentation/shared/components/data-display/GenericTable.tsx | grep -v 'unknown' | grep -v '//'
```

---

## Prioridad de Ejecución

| Orden | Fase | Tiempo | Dependencias |
|-------|------|--------|-------------|
| 1 | **B1** — Patrón backend (documentación) | 5 min | Ninguna |
| 2 | **B2** — Aplicar backend (43 archivos) | ~30 min | B1 |
| 3 | **F0** — GenericTable bulkActions + responsive | ~15 min | Ninguna |
| 4 | **F1** — Patrón frontend (documentación) | 5 min | F0 |
| 5 | **F2** — Aplicar frontend (~30 archivos) | ~30 min | B2 + F0 + F1 |
| 6 | **R1** — Verificación mobile | ~10 min | F0 |

**Total estimado:** ~95 min (~1.5 horas)

---

## Commits Recomendados

```
B1-B2: feat(backend): add batch DELETE endpoints for 9 entities

- Agrega deleteAllById a domain repository ports + persistence adapters
- Agrega deleteAll a command ports + use cases
- Excluye User, Role, Warehouse (solo soft-delete)
- Category/Product/Purchase/Sale/Transfer/Return/Adjustment
  con validación atómica previa al borrado
- Customer/Supplier sin validación (directo)

F0: feat(frontend): add bulkActions and onSelectionChange to GenericTable

- Nueva prop BulkAction<T> para acciones personalizadas
- onSelectionChange callback
- Barra de selección responsive (flex-col mobile, flex-row desktop)
- Touch targets ≥44px

F1-F2: feat(frontend): enable batch delete in all views

- deleteAll() en repositorios (9 entidades)
- selectable + onDeleteSelected en vistas sin él
- bulkActions para soft-delete (Users, Roles, Warehouses)
- Reemplaza Promise.all por request único DELETE /batch
```

---

## Notas

- ⚠️ **PurchaseRepository** tiene firma `delete(UUID id)` no `deleteById(UUID id)`. Agregar `deleteAllById(List<UUID>)` como método nuevo en el port y adapter.
- ⚠️ **Return/Adjustment** requieren cascade explícito de líneas antes de borrar el padre. `deleteAllById` debe manejar esto.
- ⚠️ **Sale/Transfer** delegan validación al modelo de dominio (`canDelete()`). El batch delete debe cargar cada entidad y validar individualmente.
- ⚠️ **No incluir**: Exchange Rates, Stock Balance, Movements (solo lectura), ni sub-resources (images, social links).
- ✅ **Categories, Customers, Suppliers** ya tienen selectable. Solo migrar de `Promise.all` a `deleteAll`.
