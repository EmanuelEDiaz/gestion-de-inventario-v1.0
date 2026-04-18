# Plan de Ejecución — Módulos Frontend Faltantes

> Generado tras auditoría completa del codebase vs. contratos (`endpoints.md`, `ports-interfaces.md`, `dtos.md`, `database-schema.md`)

---

## Resumen del Diagnóstico

### ✅ Módulos con CRUD Completo (core + infrastructure + presentation + route)
| Módulo | Entidad | Interfaz | Use Cases | Repo | Module UI | Route | Formulario | Vista |
|--------|---------|----------|-----------|------|-----------|-------|------------|-------|
| Products | ✅ | ✅ | ✅ (3) | ✅ | ✅ (table+row+form+search) | ✅ (+/new) | ✅ | ✅ (list+create) |
| Categories | ✅ | ✅ | ✅ (3) | ✅ | ✅ (list+form) | ✅ | ✅ | ✅ |
| Warehouses | ✅ | ✅ | ✅ (3) | ✅ | ✅ (card+form) | ✅ (+/new) | ✅ | ✅ (list+create) |

### ⚠️ Módulos con List/Table (sin formularios de creación ni views)
| Módulo | Entidad | Interfaz | Use Cases | Repo | Table | Hook | Form | View | Create Route |
|--------|---------|----------|-----------|------|-------|------|------|------|-------------|
| Sales | ✅ | ✅ | ✅ (6) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Purchases | ✅ | ✅ | ✅ (7) | ✅ | ✅+Detail | ✅ | ❌ | ❌ | ❌ |
| Transfers | ✅ | ✅ | ✅ (6) | ✅ | ✅+Row+Actions | ✅ | ❌ | ❌ | ❌ |
| Adjustments | ✅ | ✅ | ✅ (7) | ✅ | ✅+Row+Actions | ✅ | ❌ | ❌ | ❌ |
| Returns | ✅ | ✅ | ✅ (5) | ✅ | ✅+Row+Actions | ✅ | ❌ | ❌ | ❌ |
| Suppliers | ✅ | ✅ | ✅ (3) | ✅ | ✅+Row+Actions | ✅ | ❌ | ❌ | ❌ |
| Customers | ✅ | ✅ | ✅ (3) | ✅ | ✅+Row+Actions | ✅ | ❌ | ❌ | ❌ |
| Stock | ✅ | ✅ | ✅ (5) | ✅ | ✅+Card | ✅ | N/A | ❌ | N/A |
| Movements | ✅ | ✅ | ✅ (5) | ✅ | ✅ | ✅ | N/A | ❌ | N/A |
| Dashboard | ✅ | ✅ | ✅ (1) | ✅ | ✅ (grid+list) | ✅ | N/A | N/A | N/A |

### ❌ Módulos Completamente Faltantes (0 archivos)
| Módulo | Entidad | Interfaz | Use Cases | Repo | Module UI | Route |
|--------|---------|----------|-----------|------|-----------|-------|
| **Currencies** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Exchange Rates** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Settings** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Reports** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Import/Export** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Users Management** | ✅ entidad | ❌ interfaz | ❌ | ❌ | ❌ | ❌ |
| **POS** (venta rápida) | Usa Sale | — | — | — | ❌ | ❌ (ruta vacía) |

### 🔧 Problemas de Patrón Detectados
1. **Hooks sin naming `*Controller`**: `useSales`, `usePurchases`, `useStock`, `useAdjustments`, `useCustomers`, `useSuppliers`, `useTransfers`, `useReturns`, `useMovements` → deberían ser `use*Controller`
2. **Módulos sin `views/`**: 9 de 13 módulos no tienen vistas de composición
3. **`infrastructure/mappers/`**: directorio vacío — no hay mappers DTO↔Entity
4. **Hooks usan `useState` directo**: deberían migrar a TanStack Query para server state (regla CLAUDE.md)
5. **Rutas vacías**: `(pos)/`, `(public)/`, `(reports)/`, `(settings)/`, `api/`
6. **No hay ruta `(admin)/sales/`**: las ventas no tienen página
7. **No hay ruta `(admin)/stock/` ni `(admin)/movements/`**: consulta de inventario sin página
8. **No hay `(admin)/purchases/new`**: solo lectura, no creación

---

## Plan de Ejecución por Fases

### Fase 1 — Dominios Faltantes (core + infrastructure)
> Entidades, interfaces, use-cases y repositorios que NO existen

| # | Tarea | Archivos a Crear | Prioridad |
|---|-------|------------------|-----------|
| 1.1 | Entidad Currency | `core/entities/currency.ts` | Alta |
| 1.2 | Entidad ExchangeRate | `core/entities/exchange-rate.ts` | Alta |
| 1.3 | Entidad AppSettings | `core/entities/app-settings.ts` | Alta |
| 1.4 | Entidad ImportJob | `core/entities/import-job.ts` | Media |
| 1.5 | Interfaz ICurrencyRepository | `core/interfaces/ICurrencyRepository.ts` | Alta |
| 1.6 | Interfaz IExchangeRateRepository | `core/interfaces/IExchangeRateRepository.ts` | Alta |
| 1.7 | Interfaz ISettingsRepository | `core/interfaces/ISettingsRepository.ts` | Alta |
| 1.8 | Interfaz IUserRepository | `core/interfaces/IUserRepository.ts` | Media |
| 1.9 | Interfaz IReportRepository | `core/interfaces/IReportRepository.ts` | Media |
| 1.10 | Interfaz IImportRepository | `core/interfaces/IImportRepository.ts` | Baja |
| 1.11 | Interfaz IExportRepository | `core/interfaces/IExportRepository.ts` | Baja |
| 1.12 | Use cases Currency | `core/use-cases/currency/` (3 archivos) | Alta |
| 1.13 | Use cases ExchangeRate | `core/use-cases/exchange-rate/` (3 archivos) | Alta |
| 1.14 | Use cases Settings | `core/use-cases/settings/` (2 archivos) | Alta |
| 1.15 | Use cases Users | `core/use-cases/user/` (3 archivos) | Media |
| 1.16 | Use cases Reports | `core/use-cases/report/` (3 archivos) | Media |
| 1.17 | Use cases Import | `core/use-cases/import/` (3 archivos) | Baja |
| 1.18 | Use cases Export | `core/use-cases/export/` (2 archivos) | Baja |
| 1.19 | Repo CurrencyRepository | `infrastructure/repositories/CurrencyRepository.ts` | Alta |
| 1.20 | Repo ExchangeRateRepository | `infrastructure/repositories/ExchangeRateRepository.ts` | Alta |
| 1.21 | Repo SettingsRepository | `infrastructure/repositories/SettingsRepository.ts` | Alta |
| 1.22 | Repo UserRepository | `infrastructure/repositories/UserRepository.ts` | Media |
| 1.23 | Repo ReportRepository | `infrastructure/repositories/ReportRepository.ts` | Media |
| 1.24 | Repo ImportRepository | `infrastructure/repositories/ImportRepository.ts` | Baja |
| 1.25 | Repo ExportRepository | `infrastructure/repositories/ExportRepository.ts` | Baja |

**Estimado: ~35 archivos nuevos**

---

### Fase 2 — Formularios de Creación para Módulos Existentes
> Los módulos ya tienen table+list pero no pueden CREAR registros

| # | Tarea | Archivos a Crear |
|---|-------|------------------|
| 2.1 | SaleForm (líneas de venta con selector de producto) | `modules/sales/components/form/SaleFormFields.tsx` |
| 2.2 | SalesListView + SaleCreateView | `modules/sales/views/SalesListView.tsx`, `SaleCreateView.tsx` |
| 2.3 | useSalesController (renombrar hook + TanStack Query) | `modules/sales/hooks/useSalesController.ts`, `useSaleFormController.ts` |
| 2.4 | Route `/sales` + `/sales/new` | `app/(admin)/sales/page.tsx`, `app/(admin)/sales/new/page.tsx` |
| 2.5 | PurchaseForm (líneas con costo unitario) | `modules/purchases/components/form/PurchaseFormFields.tsx` |
| 2.6 | PurchasesListView + PurchaseCreateView | `modules/purchases/views/` |
| 2.7 | usePurchasesController + usePurchaseFormController | `modules/purchases/hooks/` |
| 2.8 | Route `/purchases/new` | `app/(admin)/purchases/new/page.tsx` |
| 2.9 | TransferForm | `modules/transfers/components/form/TransferFormFields.tsx` |
| 2.10 | TransfersListView + TransferCreateView | `modules/transfers/views/` |
| 2.11 | useTransfersController + useTransferFormController | `modules/transfers/hooks/` |
| 2.12 | AdjustmentForm | `modules/adjustments/components/form/AdjustmentFormFields.tsx` |
| 2.13 | AdjustmentsListView + AdjustmentCreateView | `modules/adjustments/views/` |
| 2.14 | useAdjustmentsController + useAdjustmentFormController | `modules/adjustments/hooks/` |
| 2.15 | Route `/adjustments/new` | `app/(admin)/adjustments/new/page.tsx` |
| 2.16 | ReturnForm | `modules/returns/components/form/ReturnFormFields.tsx` |
| 2.17 | ReturnsListView + ReturnCreateView | `modules/returns/views/` |
| 2.18 | useReturnsController + useReturnFormController | `modules/returns/hooks/` |
| 2.19 | Route `/returns/new` | `app/(admin)/returns/new/page.tsx` |
| 2.20 | SupplierForm | `modules/suppliers/components/form/SupplierFormFields.tsx` |
| 2.21 | SuppliersListView + SupplierCreateView | `modules/suppliers/views/` |
| 2.22 | useSuppliersController + useSupplierFormController | `modules/suppliers/hooks/` |
| 2.23 | Route `/suppliers/new` | `app/(admin)/suppliers/new/page.tsx` |
| 2.24 | CustomerForm | `modules/customers/components/form/CustomerFormFields.tsx` |
| 2.25 | CustomersListView + CustomerCreateView | `modules/customers/views/` |
| 2.26 | useCustomersController + useCustomerFormController | `modules/customers/hooks/` |
| 2.27 | Route `/customers/new` | `app/(admin)/customers/new/page.tsx` |

**Estimado: ~40 archivos nuevos + refactors de hooks existentes**

---

### Fase 3 — Módulos Nuevos Completos (UI end-to-end)

| # | Tarea | Archivos |
|---|-------|----------|
| 3.1 | Módulo Currencies (tabla + form + vista + hook + route) | `modules/currencies/` (7+ archivos) |
| 3.2 | Módulo Exchange Rates (tabla + form + vista + hook + route) | `modules/exchange-rates/` (7+ archivos) |
| 3.3 | Módulo Settings (formulario de configuración global) | `modules/settings/` (5+ archivos), route `(settings)/` |
| 3.4 | Módulo Users Management (tabla + form + vista + hook + route) | `modules/users/` (7+ archivos) |
| 3.5 | Vista Stock con filtros (sin creación — solo consulta) | `modules/stock/views/StockListView.tsx`, route `(admin)/stock/` |
| 3.6 | Vista Movements con filtros | `modules/movements/views/MovementsListView.tsx`, route `(admin)/movements/` |
| 3.7 | Módulo Reports (dashboard ventas + inventario) | `modules/reports/` (6+ archivos), route `(reports)/` |
| 3.8 | Módulo Import/Export | `modules/import-export/` (6+ archivos) |
| 3.9 | POS (punto de venta rápida — simplified sale) | `modules/pos/` (6+ archivos), route `(pos)/` |

**Estimado: ~55 archivos nuevos**

---

### Fase 4 — Migración a TanStack Query + Renaming Hooks
> Todos los hooks actuales usan `useState` para server data — CLAUDE.md prohíbe esto

| # | Tarea |
|---|-------|
| 4.1 | Migrar `useSales` → `useSalesController` con `useQuery`/`useMutation` |
| 4.2 | Migrar `usePurchases` → `usePurchasesController` con TanStack Query |
| 4.3 | Migrar `useStock` → `useStockController` con TanStack Query |
| 4.4 | Migrar `useAdjustments` → `useAdjustmentsController` con TanStack Query |
| 4.5 | Migrar `useCustomers` → `useCustomersController` con TanStack Query |
| 4.6 | Migrar `useSuppliers` → `useSuppliersController` con TanStack Query |
| 4.7 | Migrar `useTransfers` → `useTransfersController` con TanStack Query |
| 4.8 | Migrar `useReturns` → `useReturnsController` con TanStack Query |
| 4.9 | Migrar `useMovements` → `useMovementsController` con TanStack Query |

**Estimado: 9 archivos refactorizados**

---

### Fase 5 — Infraestructura y Calidad
| # | Tarea |
|---|-------|
| 5.1 | Implementar mappers en `infrastructure/mappers/` (DTO↔Entity transformaciones) |
| 5.2 | Middleware de autenticación Next.js (proteger rutas server-side) |
| 5.3 | BFF API routes en `app/api/` si se necesitan |
| 5.4 | Sidebar: agregar links a módulos nuevos (stock, movements, currencies, settings, reports, users, import/export) |
| 5.5 | Actualizar `useCacheProgress` MODULE_DEFS para nuevos stores |
| 5.6 | Tooltips en español (Pendiente.md: "descripción al pasar mouse") |
| 5.7 | QR/Link para acceso desde hotspot (Pendiente.md) |

---

## Orden de Ejecución Recomendado

```
Fase 1 (core + infra)         ──┐
                                 ├── Semana 1-2
Fase 4 (TanStack migration)  ──┘

Fase 2 (formularios)           ── Semana 2-3

Fase 3 (módulos nuevos)        ── Semana 3-5

Fase 5 (infra + calidad)       ── Semana 5-6
```

**Alternativa pragmática**: Hacer módulo por módulo end-to-end (core→infra→UI→route) en lugar de por capa. Esto permite probar cada módulo completo antes de avanzar al siguiente.

---

## Prioridades Sugeridas

### Críticos (necesarios para operación básica)
1. **Sales + POS** — sin esto no se vende
2. **Purchases** — sin esto no se compra
3. **Stock/Movements views** — visibilidad del inventario
4. **Settings** — configuración de moneda y método de costos

### Importantes (operación completa)
5. **Suppliers/Customers forms** — CRUD completo de terceros
6. **Transfers/Adjustments/Returns forms** — operaciones de inventario
7. **Currencies/Exchange Rates** — soporte multi-moneda

### Deseables (valor agregado)
8. **Reports** — dashboard de ventas e inventario
9. **Users Management** — CRUD de usuarios
10. **Import/Export** — carga masiva
11. **Middleware auth** — seguridad server-side

---

## Reglas a Seguir (de skills cargados)

- **Hexagonal**: mantener `core/` sin dependencias de framework
- **project-structure**: subfolder por tipo (components/, hooks/, views/), hooks como `use*Controller.ts`
- **patterns**: máximo 100 líneas por componente, 1 componente por archivo
- **react-best-practices**: TanStack Query para server state, no `useState` para datos remotos
- **CLAUDE.md**: español para labels/texto visible, inglés para código; sin CDNs; sin `any`
- **Pendiente.md**: tooltips descriptivos, QR de acceso hotspot, middleware auth
