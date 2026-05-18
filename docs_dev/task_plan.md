# Plan de Reestructuración del Proyecto - Gestión de Inventario

> Created: 2026-05-17 | Auditoría completa con 3 agentes paralelos + graphify
> ⚠️ **Sección actual: 6 — Pendiente de inicio**

---

## Resumen Ejecutivo de Auditoría

| Métrica | Backend | Frontend |
|---------|---------|----------|
| Archivos totales | 432 `.java` | 454 `.ts/.tsx` |
| Tests | 5 (1.1% ratio) | 30 (6.6% ratio) |
| Carpetas con >10 archivos | 15 | 8 |
| Componentes >100 líneas | — | 30 |
| Hooks >150 líneas | — | 4 |
| Usos de `any` sin justificación | — | 20 en 3 archivos |
| Violaciones hexagonales | 2 críticas | — |
| Clientes HTTP duplicados | — | 2 (api-client.ts + client.ts) |
| Tablas que NO usan GenericTable | — | 7 |
| Versiones de Card | — | 2 (legacy + shadcn) |
| DomainExceptions implementadas | 10 de ~30 necesarias | — |
| API_URL hardcodeada | — | en 36 lugares |
| Mappers manuales (sin MapStruct) | 24 en 3 capas | — |

---

## Progreso del Plan

| Sección | Estado | Archivos | Commit msg |
|---------|--------|----------|------------|
| **1** | ✅ Completado | 30 | `feat(http): unify HTTP clients, centralize API_URL with getMediaUrl()` |
| **2** | ✅ Completado | 10 | `refactor(frontend): unify GenericTable, migrate 7 manual tables` |
| **3** | ✅ Completado | 48 | `refactor(frontend): migrate hardcoded colors to semantic tokens` |
| **4** | ✅ Completado | 10 | `refactor(frontend): add useStatusActions and useReferenceData hooks, migrate 3 tables` |
| **5** | ✅ Completado | 8 (+26 subcomponentes) | `refactor(frontend): split 8 products components into ≤100-line subcomponents` |
| **6** | ❌ Pendiente | 10 | — |
| **7** | ❌ Pendiente | 10 | — |
| **8** | ❌ Pendiente | 10 | — |
| **9** | ❌ Pendiente | 10 | — |
| **10** | ❌ Pendiente | 7 | — |
| **11** | ❌ Pendiente | 10 | — |
| **12** | ❌ Pendiente | 8 | — |
| **13** | ❌ Pendiente | 10 | — |
| **14** | ❌ Pendiente | 10 | — |
| **15** | ❌ Pendiente | 9 | — |

---

## Problemas Identificados

### 🔴 Alta Prioridad

| # | Problema | Impacto | Ubicación |
|---|----------|---------|-----------|
| H1 | **2 clientes HTTP duplicados** con misma lógica JWT + refresh | Seguridad: fix asimétrico deja vulnerable | `api-client.ts` + `client.ts` |
| H2 | **GenericTable duplicado** (2 copias) sin `hidden` en una | Bug potencial: mismo componente, distinto comportamiento | `shared/components/GenericTable.tsx` + `genericTable/` |
| H3 | **API_URL hardcodeada** en 36 lugares | Cambio de URL = editar 36 archivos | Múltiples componentes + scripts |
| H4 | **7 tablas manuales** que no usan GenericTable | ~400 líneas duplicadas | `SaleTable`, `PurchaseTable`, `SupplierTable`, etc. |
| H5 | **2 versiones de Card** compitiendo (legacy vs shadcn) | Inconsistencia visual + 2 sistemas de color | `Card.tsx` + `ui/card.tsx` |
| H6 | **Colores hardcodeados** en ~30+ componentes (blue-600, green-100, etc.) | Cambiar tema = editar 30+ archivos | Múltiples componentes |

### 🔴 Backend Crítico

| # | Problema | Impacto | Ubicación |
|---|----------|---------|-----------|
| B1 | **Violación hexagonal**: `application/service/` importa `adapters/persistence/` directamente | Acoplamiento: dominio depende de infraestructura | `NotificationPreferencesService`, `NotificationSchedulesService` |
| B2 | **Spring Data Pageable en dominio puro** | Framework leak en hexágono interior | `domain/ports/in/NotificationQueryPort.java` |
| B3 | **0 tests de controllers, use cases, adapters** | Sin confianza en refactors | Toda la capa application + adapters |
| B4 | **DomainExceptions genéricas** en vez de específicas por entidad | Catch depende de strings, no de tipos | `domain/errors/` (10 genéricas, faltan ~20 específicas) |

### 🟡 Media Prioridad

| # | Problema | Ubicación |
|---|----------|-----------|
| M1 | 30 componentes >100 líneas | Frontend varios |
| M2 | 4 hooks >150 líneas (~80% código duplicado en notificaciones) | `shared/hooks/` |
| M3 | 20 usos de `any` sin justificación | 3 archivos de notificaciones |
| M4 | 2 services que NO siguen patrón CQRS (application/service/) | Backend |
| M5 | 24 mappers manuales en 3 capas (sin MapStruct) | Backend application + persistence + web |
| M6 | Fetch de catálogos duplicado en SaleFormFields + PurchaseFormFields | Frontend forms |
| M7 | `Select.tsx` legacy sin `cn()` ni props label/error | `shared/components/Select.tsx` |
| M8 | Sin `<Dialog>` genérico reutilizable | Frontend shared/ui |
| M9 | Sin `ErrorWebExceptionHandler` global en backend | Backend |
| M10 | Estructura inconsistente en `adapters/persistence/adapter/` vs raíz | Backend |

---

## Fase 1: Unificar Clientes HTTP (10 archivos)

> **Objetivo:** Fusionar `api-client.ts` y `client.ts` en uno solo, centralizar `API_BASE_URL` y `getMediaUrl`

| # | Archivo | Acción |
|---|---------|--------|
| 1.1 | `frontend/src/infrastructure/api/client.ts` | Mantener como único cliente (tiene más features: `isApiError()`, `getErrorMessage()`) |
| 1.2 | `frontend/src/presentation/shared/lib/api-client.ts` | Eliminar y redirigir imports a `infrastructure/api/client.ts` |
| 1.3 | `frontend/src/presentation/shared/lib/utils.ts` | Agregar `getMediaUrl(filePath: string): string` |
| 1.4 | `frontend/src/presentation/modules/products/components/ProductImageGallery.tsx` | Reemplazar `API_URL` hardcodeado con `getMediaUrl()` |
| 1.5 | `frontend/src/presentation/modules/products/components/table/ProductTable.tsx` | Reemplazar `API_URL` con `getMediaUrl()` |
| 1.6 | `frontend/src/presentation/modules/products/components/table/ProductRow.tsx` | Reemplazar `API_URL` con `getMediaUrl()` |
| 1.7 | `frontend/src/presentation/modules/products/components/ImageLightbox.tsx` | Reemplazar `API_URL` con `getMediaUrl()` |
| 1.8 | `frontend/src/presentation/modules/suppliers/components/SupplierImageCarousel.tsx` | Reemplazar `API_URL` con `getMediaUrl()` |
| 1.9 | `frontend/src/presentation/modules/customers/components/CustomerImageCarousel.tsx` | Reemplazar `API_URL` con `getMediaUrl()` |
| 1.10 | `frontend/src/presentation/shared/hooks/useNetworkHealth.ts` | Reemplazar `LOCAL_HEALTH_URL` hardcodeado |

✅ **Check:** `rg 'http://localhost:8080' --include '*.ts' --include '*.tsx' frontend/src/` debe dar 0 resultados excepto config/env

---

## Fase 2: Eliminar GenericTable Duplicado + Migrar Tablas Manuales (10 archivos)

> **Objetivo:** Unificar las 2 copias de GenericTable y migrar 7 tablas manuales

| # | Archivo | Acción |
|---|---------|--------|
| 2.1 | `frontend/src/presentation/shared/components/genericTable/GenericTable.tsx` | Eliminar (mover funcionalidad `hidden` a la copia canónica) |
| 2.2 | `frontend/src/presentation/shared/components/genericTable/GenericTableHeader.tsx` | Eliminar |
| 2.3 | `frontend/src/presentation/shared/components/genericTable/GenericTableBody.tsx` | Eliminar |
| 2.4 | `frontend/src/presentation/shared/components/GenericTable.tsx` | Agregar prop `hidden?: (row: T) => boolean` (desde la copia eliminada) |
| 2.5 | `frontend/src/presentation/modules/sales/components/SaleTable.tsx` | Migrar a GenericTable |
| 2.6 | `frontend/src/presentation/modules/purchases/components/PurchaseTable.tsx` | Migrar a GenericTable |
| 2.7 | `frontend/src/presentation/modules/customers/components/CustomerTable.tsx` | Migrar a GenericTable |
| 2.8 | `frontend/src/presentation/modules/suppliers/components/SupplierTable.tsx` | Migrar a GenericTable |
| 2.9 | `frontend/src/presentation/modules/transfers/components/TransferTable.tsx` | Migrar a GenericTable |
| 2.10 | `frontend/src/presentation/modules/stock/components/StockBalanceTable.tsx` | Migrar a GenericTable + `MovementTable.tsx` |

✅ **Check:** `pnpm lint` + `pnpm build` exitosos. Ninguna tabla usa `<table>` directo fuera de GenericTable.

---

## Fase 3: Estandarizar Cards y Theme System (10 archivos)

> **Objetivo:** Unificar cards en shadcn/ui, migrar colores hardcodeados a tokens semánticos

| # | Archivo | Acción |
|---|---------|--------|
| 3.1 | `frontend/src/presentation/shared/components/Card.tsx` | Eliminar (legacy, reemplazar por `ui/card.tsx`) |
| 3.2 | `frontend/src/presentation/modules/warehouses/components/WarehouseCard.tsx` | Migrar de Card legacy a `ui/card.tsx` |
| 3.3 | `frontend/src/presentation/modules/roles/components/RoleCard.tsx` | Reemplazar inline styles por `ui/card.tsx` |
| 3.4 | `frontend/src/presentation/modules/stock/components/StockBalanceCard.tsx` | Migrar a `ui/card.tsx` |
| 3.5 | `frontend/src/presentation/modules/reports/components/ReportCards.tsx` | Verificar usa `ui/card.tsx` (si no, migrar) |
| 3.6 | `frontend/tailwind.config.ts` | Agregar colores semánticos: `primary`, `success`, `warning`, `danger`, `info` |
| 3.7 | `frontend/src/presentation/modules/products/components/table/ProductTable.tsx` | Reemplazar `text-blue-600` → `text-primary` |
| 3.8 | `frontend/src/presentation/modules/suppliers/components/SupplierRow.tsx` | Reemplazar `bg-green-100 text-green-800` → `bg-success/10 text-success` |
| 3.9 | `frontend/src/presentation/modules/customers/components/CustomerRow.tsx` | Reemplazar `bg-green-100` → `bg-success/10` |
| 3.10 | `frontend/src/presentation/shared/components/ui/badge.tsx` | Verificar usa variables CSS (debería, es shadcn) |

✅ **Check:** `rg 'bg-(green|red|blue|yellow)-' frontend/src/` debe tener 0 resultados en componentes UI

---

## Fase 4: Refactorizar Tablas de Ventas/Compras (10 archivos)

> **Objetivo:** Abstraer lógica duplicada de status-action mapping entre Sale y Purchase

| # | Archivo | Acción |
|---|---------|--------|
| 4.1 | `frontend/src/presentation/modules/sales/components/SaleTable.tsx` | Extraer lógica de botones condicionales a `useStatusActions` |
| 4.2 | `frontend/src/presentation/modules/purchases/components/PurchaseTable.tsx` | Extraer lógica de botones condicionales a `useStatusActions` |
| 4.3 | `frontend/src/presentation/shared/hooks/useStatusActions.ts` | **Crear** hook genérico para mapear estados → acciones |
| 4.4 | `frontend/src/presentation/modules/returns/components/ReturnTable.tsx` | Migrar a GenericTable + `useStatusActions` |
| 4.5 | `frontend/src/presentation/modules/users/components/UserTable.tsx` | Migrar a GenericTable |
| 4.6 | `frontend/src/presentation/modules/sales/components/form/SaleFormFields.tsx` | Extraer fetch de catálogos a `useReferenceData` |
| 4.7 | `frontend/src/presentation/modules/purchases/components/form/PurchaseFormFields.tsx` | Extraer fetch de catálogos a `useReferenceData` |
| 4.8 | `frontend/src/presentation/shared/hooks/useReferenceData.ts` | **Crear** hook compartido para catálogos (warehouses, products, customers, suppliers) |
| 4.9 | `frontend/src/presentation/modules/transfers/components/form/TransferFormFields.tsx` | Migrar a `useReferenceData` |
| 4.10 | `frontend/src/presentation/modules/currencies/components/CurrencyTable.tsx` | Eliminar wrapper y usar GenericTable directamente |

✅ **Check:** `SaleFormFields.tsx` y `PurchaseFormFields.tsx` no deben tener `useEffect` con fetch directo

---

## Fase 5: Componentes >100 líneas — Productos (8 archivos)

> **Objetivo:** Dividir los componentes más grandes del módulo products

| # | Archivo (líneas) | Acción |
|---|------------------|--------|
| 5.1 | `ProductImageGallery.tsx` (237) | Extraer: `ImageGalleryGrid`, `ImageUploadZone`, `ImageThumbnail`, `GalleryModal` |
| 5.2 | `ProductTable.tsx` (161) | Extraer: `ProductTableActions`, `ProductImageCell`, `ProductStatusCell` |
| 5.3 | `ProductFiltersPanel.tsx` (159) | Extraer filtros individuales como subcomponentes |
| 5.4 | `ProductEditView.tsx` (156) | Extraer secciones del formulario de edición |
| 5.5 | `ProductCreateImageCarousel.tsx` (156) | Extraer: `ImageUploader`, `ImagePreviewModal` |
| 5.6 | `ProductsInfiniteList.tsx` (148) | Extraer: `InfiniteListContainer`, `ProductCard`, `ListLoader` |
| 5.7 | `ProductFormFields.tsx` (147) | Extraer: `ProductBasicInfo`, `ProductPricing`, `ProductInventoryFields` |
| 5.8 | `ComboboxSelect.tsx` (181) | Si es genérico, justificar. Extraer opciones de búsqueda/filtro. |

✅ **Check:** `find . -name "*.tsx" -exec wc -l {} \; | awk '$1 > 100'` en products debe dar 0

---

## Fase 6: Componentes >100 líneas — Generales (10 archivos)

> **Objetivo:** Dividir componentes grandes compartidos y de otros módulos

| # | Archivo (líneas) | Acción |
|---|------------------|--------|
| 6.1 | `PreferencesPanel.tsx` (297) | Dividir en: `PreferenceToggle`, `PreferenceSection`, `ScheduleSelector` |
| 6.2 | `SettingsFormFields.tsx` (240) | Extraer: `GeneralSettingsFields`, `NotificationSettingsFields`, `SystemSettingsFields` |
| 6.3 | `SidebarSection.tsx` (196) | Extraer subcomponentes de items de menú |
| 6.4 | `NotificationPanel.tsx` (195) | Extraer: `NotificationList`, `NotificationFilter` |
| 6.5 | `SaleFormFields.tsx` (193) | Extraer: `SaleItemRow`, `SaleCustomerSelector`, `SaleSummary` |
| 6.6 | `login/page.tsx` (192) | Extraer: `LoginForm`, `LoginHeader`, `SocialLoginButtons` |
| 6.7 | `NotificationTabs.tsx` (171) | Dividir tabs en componentes separados |
| 6.8 | `DashboardLayout.tsx` (171) | Extraer: `DashboardHeader`, `DashboardMain` |
| 6.9 | `NotificationTray.tsx` (166) | Extraer: `TrayHeader`, `TrayList`, `TrayFooter` |
| 6.10 | `ComposeMessageDialog.tsx` (152) | Extraer: `MessageRecipientSelector`, `MessageComposer`, `MessagePreview` |

✅ **Check:** Ningún componente compartido debe exceder 100 líneas

---

## Fase 7: Componentes >100 líneas — Restantes (10 archivos)

> **Objetivo:** Completar la división de componentes grandes restantes

| # | Archivo (líneas) | Acción |
|---|------------------|--------|
| 7.1 | `SupplierSocialLinks.tsx` (146) | Extraer enlaces individuales |
| 7.2 | `SaleDetailView.tsx` (146) | Extraer secciones de detalle |
| 7.3 | `ReturnFormFields.tsx` (146) | Extraer secciones: items, motivo, acciones |
| 7.4 | `PurchaseDetail.tsx` (146) | Extraer secciones de detalle de compra |
| 7.5 | `CustomerImageCarousel.tsx` (144) | Extraer: `CustomerImage`, `ImageCarousel` |
| 7.6 | `AdjustmentFormFields.tsx` (141) | Extraer secciones de ajuste |
| 7.7 | `SupplierImageCarousel.tsx` (140) | Extraer: `SupplierImage`, `ImageCarousel` |
| 7.8 | `PurchaseFormFields.tsx` (137) | Extraer secciones: items, proveedor, totales |
| 7.9 | `SupplierCatalogProducts.tsx` (133) | Extraer tabla de catálogo + búsqueda |
| 7.10 | `NotificationItem.tsx` (126) | Extraer: `NotificationIcon`, `NotificationContent`, `NotificationActions` |

✅ **Check:** `find . -name "*.tsx" -exec wc -l {} \; | awk '$1 > 100 {print}' | wc -l` debe ser 0

---

## Fase 8: Hooks >150 líneas — Notificaciones (10 archivos)

> **Objetivo:** Dividir y abstraer hooks de notificaciones (~80% código duplicado)

| # | Archivo (líneas) | Acción |
|---|------------------|--------|
| 8.1 | `shared/hooks/useNotificationPreferences.ts` (367) | Dividir en: `usePreferencesQuery`, `usePreferencesMutation`, `useScheduleQuery`, `useScheduleMutation` |
| 8.2 | `shared/hooks/useSystemNotifications.ts` (351) | Dividir en: `useSystemNotificationsQuery`, `useSystemNotificationsMutations`, `useNotificationStream` |
| 8.3 | `shared/hooks/useUserNotifications.ts` (346) | Dividir en: `useUserNotificationsQuery`, `useUserNotificationsMutations`, `useUserNotificationStream` |
| 8.4 | `shared/hooks/useNotificationToasts.ts` (176) | Dividir en: `useToastManager`, `usePermissionDeniedToast` |
| 8.5 | `shared/hooks/useNotificationsShared.ts` | **Crear** hook base `useBaseNotificationList` con lógica común (infinite query, mutations, SSE) |
| 8.6 | `useUserNotifications.ts` | Refactorizar para usar hook base |
| 8.7 | `useSystemNotifications.ts` | Refactorizar para usar hook base |
| 8.8 | `useNotificationPreferences.ts` | Refactorizar para usar hook base |
| 8.9 | `useNotificationToasts.ts` | Refactorizar para usar hook base |
| 8.10 | **Eliminar `any`** en callbacks onMutate/onSettled (20 usos) | Tipar como `InfiniteData<PageType>` | 

✅ **Check:** `find . -name "*.ts" -path "*/hooks/*" -exec wc -l {} \; | awk '$1 > 150'` debe dar 0

---

## Fase 9: Errores Personalizados TypeScript (10 archivos)

> **Objetivo:** Implementar errores tipados específicos por dominio (AGENTS.md: extender Error)

| # | Archivo | Acción |
|---|---------|--------|
| 9.1 | `frontend/src/core/errors/index.ts` | **Crear** export centralizado |
| 9.2 | `frontend/src/core/errors/ProductErrors.ts` | **Crear**: `ProductNotFoundError`, `ProductDuplicateError`, `ProductOutOfStockError` |
| 9.3 | `frontend/src/core/errors/SaleErrors.ts` | **Crear**: `SaleNotFoundError`, `SaleNotEditableError`, `InsufficientStockError` |
| 9.4 | `frontend/src/core/errors/CustomerErrors.ts` | **Crear**: `CustomerNotFoundError`, `CustomerDebtLimitExceededError` |
| 9.5 | `frontend/src/core/errors/CategoryErrors.ts` | **Crear**: `CategoryNotFoundError`, `CategoryInUseError` |
| 9.6 | `core/use-cases/product/CreateProductUseCase.ts` | Reemplazar `throw new Error(...)` con `ProductErrors` |
| 9.7 | `core/use-cases/product/UpdateProductUseCase.ts` | Reemplazar `Error` con `ProductErrors` |
| 9.8 | `core/use-cases/category/DeleteCategoryUseCase.ts` | Reemplazar `Error` con `CategoryErrors` |
| 9.9 | `core/use-cases/auth/LoginUseCase.ts` | Reemplazar `Error` con `AuthErrors` |
| 9.10 | `core/use-cases/warehouse/ToggleWarehouseStatusUseCase.ts` | Reemplazar `Error` con `WarehouseErrors` |

✅ **Check:** `pnpm lint` + `pnpm test:run` exitosos

---

## Fase 10: Backend — Violaciones Hexagonales + Tests (10 archivos)

> **Objetivo:** Corregir acoplamiento en application/service/, agregar tests críticos

| # | Archivo | Acción |
|---|---------|--------|
| 10.1 | `application/service/NotificationPreferencesService.java` | Refactorizar: usar ports de dominio, no repositorios directos |
| 10.2 | `application/service/NotificationSchedulesService.java` | Refactorizar: usar ports de dominio |
| 10.3 | `domain/ports/in/NotificationQueryPort.java` | Eliminar `Pageable` de Spring, crear `PageRequest` propio en domain |
| 10.4 | `domain/shared/PageRequest.java` | **Crear** value object con `offset` + `limit` |
| 10.5 | `src/test/java/com/inventory/ArchitectureTest.java` | Agregar regla: application NO puede importar adapters |
| 10.6 | `src/test/.../application/usecase/product/CreateProductUseCaseTest.java` | **Crear** test de use case |
| 10.7 | `src/test/.../adapters/web/controller/ProductControllerTest.java` | **Crear** test de controller |
| 10.8 | `src/test/.../application/usecase/sale/CreateSaleUseCaseTest.java` | **Crear** test de use case |
| 10.9 | `src/test/.../domain/model/PurchaseTest.java` | **Crear** test de dominio (modelos faltantes) |
| 10.10 | `src/test/.../domain/model/CategoryTest.java` | **Crear** test de dominio |

✅ **Check:** `./mvnw test` verde. ArchitectureTest detecta violaciones.

---

## Fase 11: Backend — DomainExceptions Específicas (10 archivos)

> **Objetivo:** Reemplazar excepciones genéricas por específicas por entidad

| # | Archivo | Acción |
|---|---------|--------|
| 11.1 | `domain/errors/ProductNotFoundError.java` | **Crear** (extends DomainException, campo `productId`) |
| 11.2 | `domain/errors/ProductDuplicateError.java` | **Crear** |
| 11.3 | `domain/errors/ProductOutOfStockError.java` | **Crear** |
| 11.4 | `domain/errors/SaleNotFoundError.java` | **Crear** |
| 11.5 | `domain/errors/InsufficientStockError.java` | **Crear** |
| 11.6 | `domain/errors/CustomerNotFoundError.java` | **Crear** |
| 11.7 | `domain/errors/CategoryNotFoundError.java` | **Crear** |
| 11.8 | `domain/errors/SupplierNotFoundError.java` | **Crear** |
| 11.9 | `domain/errors/WarehouseNotFoundError.java` | **Crear** |
| 11.10 | `adapters/web/GlobalErrorHandler.java` | **Crear** `@ControllerAdvice` / `ErrorWebExceptionHandler` para `application/problem+json` |

✅ **Check:** `./mvnw compile` exitoso. `rg 'extends DomainException'` muestra 20+ clases.

---

## Fase 12: Backend — Carpetas con >10 archivos (8 archivos)

> **Objetivo:** Reorganizar carpetas del backend por subdominio

| # | Archivo/Carpeta | Acción |
|---|-----------------|--------|
| 12.1 | `domain/model/` (38 archivos) | Reorganizar en `domain/{product,sale,customer,...}/model/` |
| 12.2 | `application/dto/` (50 archivos) | Reorganizar en `application/{product,sale,...}/dto/` |
| 12.3 | `domain/ports/in/` (44 archivos) | Reorganizar en `domain/{product,...}/ports/in/` |
| 12.4 | `application/usecase/command/` (30 archivos) | Reorganizar en `application/{product,...}/usecase/command/` |
| 12.5 | `application/usecase/query/` (22 archivos) | Reorganizar en `application/{product,...}/usecase/query/` |
| 12.6 | `adapters/web/controller/` (32 archivos) | Reorganizar en `adapters/web/{product,...}/controller/` |
| 12.7 | `adapters/web/dto/` (28 archivos) | Unificar con `application/dto/` o reorganizar |
| 12.8 | `adapters/persistence/` + `adapter/` (29 archivos en 2 carpetas) | Unificar en `persistence/adapter/` |

✅ **Check:** Ninguna carpeta debe tener >10 archivos (excluyendo subcarpetas)

---

## Fase 13: Frontend — Carpetas con >10 archivos (10 archivos)

> **Objetivo:** Reorganizar carpetas del frontend por subdominio

| # | Carpeta | Acción |
|---|---------|--------|
| 13.1 | `core/use-cases/` (59 archivos en 24 subdirs) | Mover use-cases dentro de `core/{product,sale,...}/use-cases/` |
| 13.2 | `core/entities/` (36 archivos) | Mover a `core/{product,sale,...}/entities/` |
| 13.3 | `core/interfaces/` (26 archivos) | Agrupar en `core/{product,sale,...}/ports/` |
| 13.4 | `infrastructure/repositories/` (30 archivos) | Mover a `infrastructure/repositories/{product,sale,...}/` |
| 13.5 | `presentation/shared/components/ui/` (7 archivos) | Verificar límite (está bien) |
| 13.6 | `presentation/shared/hooks/` (13 archivos) | Dividir en `hooks/api/`, `hooks/ui/`, `hooks/storage/` |
| 13.7 | `presentation/shared/components/` (28 archivos) | Dividir en `components/layout/`, `data-display/`, `feedback/`, `form/` |
| 13.8 | `presentation/modules/products/` (19 archivos) | Ya tiene subcarpetas, verificar |
| 13.9 | `presentation/modules/suppliers/` (17 archivos) | Ya tiene subcarpetas, verificar |
| 13.10 | `presentation/modules/customers/` (17 archivos) | Ya tiene subcarpetas, verificar |

✅ **Check:** `find . -maxdepth 3 -type d | while read d; do count=$(ls -1 "$d"/*.{ts,tsx} 2>/dev/null | wc -l); [ "$count" -gt 10 ] && echo "$count $d"; done`

---

## Fase 14: Backend — Unificar Estructura persistence/ (10 archivos)

> **Objetivo:** Resolver inconsistencia entre `persistence/` raíz y `persistence/adapter/`

| # | Archivo | Acción |
|---|---------|--------|
| 14.1 | `adapters/persistence/AdjustmentRepositoryAdapter.java` | Mover a `adapters/persistence/adapter/` |
| 14.2 | `adapters/persistence/CategoryRepositoryAdapter.java` | Mover a `adapters/persistence/adapter/` |
| 14.3 | `adapters/persistence/CurrencyRepositoryAdapter.java` | Mover a `adapters/persistence/adapter/` |
| 14.4 | `adapters/persistence/CustomerRepositoryAdapter.java` | Mover a `adapters/persistence/adapter/` |
| 14.5 | + todos los *RepositoryAdapter.java en raíz (10 más) | Mover a `adapters/persistence/adapter/` |
| 14.6 | `adapters/persistence/entity/` | Mover a `adapters/persistence/adapter/entity/` |
| 14.7 | `adapters/persistence/repository/` | Mover a `adapters/persistence/adapter/repository/` |
| 14.8 | `adapters/persistence/mapper/` | Mover a `adapters/persistence/adapter/mapper/` |
| 14.9 | `adapters/persistence/adapter/` | Renombrar a `adapters/persistence/adapter/impl/` (opcional) |
| 14.10 | Actualizar imports y tests | Reflejar nueva estructura |

✅ **Check:** `./mvnw compile` exitoso

---

## Fase 15: Cross-cutting — Validación Zod y Dialog Genérico (9 archivos)

> **Objetivo:** Agregar validación Zod y componente Dialog reutilizable

| # | Archivo | Acción |
|---|---------|--------|
| 15.1 | `frontend/src/core/validators/product-validators.ts` | **Crear**: schema Zod para producto |
| 15.2 | `frontend/src/core/validators/sale-validators.ts` | **Crear**: schema Zod para venta |
| 15.3 | `frontend/src/core/validators/customer-validators.ts` | **Crear**: schema Zod para cliente |
| 15.4 | `frontend/src/core/validators/supplier-validators.ts` | **Crear**: schema Zod para proveedor |
| 15.5 | `frontend/src/core/validators/index.ts` | **Crear**: export centralizado |
| 15.6 | `frontend/src/presentation/shared/components/ui/dialog.tsx` | **Crear** (basado en @radix-ui/react-dialog) con props: `open`, `onClose`, `title`, `description`, `children`, `size` |
| 15.7 | `frontend/src/presentation/modules/users/components/dialogs/EditUserDialog.tsx` | Migrar a Dialog genérico |
| 15.8 | `frontend/src/presentation/modules/users/components/dialogs/ChangePasswordDialog.tsx` | Migrar a Dialog genérico |
| 15.9 | `frontend/src/presentation/shared/components/Select.tsx` | Actualizar a `cn()` + props label/error (como Input.tsx) |

✅ **Check:** `pnpm lint` + `pnpm build` exitosos

---

## Comandos de Verificación (post-ejecución)

```bash
# Frontend - Componentes grandes
cd frontend/src && find . -name "*.tsx" -exec wc -l {} \; | awk '$1 > 100 {print}' | wc -l

# Frontend - Hooks grandes
cd frontend/src && find . -name "*.ts" -path "*/hooks/*" -exec wc -l {} \; | awk '$1 > 150 {print}' | wc -l

# Frontend - any sin justificación
cd frontend/src && rg ": any" --glob "*.ts"

# Frontend - API_URL hardcodeada
cd frontend/src && rg "http://localhost:8080"

# Frontend - Lint + Build
cd frontend && pnpm lint && pnpm build

# Backend - Compilar
cd backend/inventory-app && ./mvnw compile

# Backend - Tests
cd backend/inventory-app && ./mvnw test

# Carpetas >10 archivos
find frontend/src -maxdepth 3 -type d | while read d; do
  count=$(find "$d" -maxdepth 1 -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null | wc -l)
  [ "$count" -gt 10 ] && echo "$count $d"
done
```

---

## Commits Recomendados (al completar todo el plan)

```
refactor: unificar clientes HTTP, eliminar duplicación de GenericTable y estandarizar sistema de Cards

- Fusiona api-client.ts y client.ts en infrastructure/api/client.ts
- Crea helper getMediaUrl() centralizado
- Elimina copia duplicada de GenericTable en genericTable/
- Migra 7 tablas manuales a GenericTable
- Unifica sistema de Card en ui/card.tsx (shadcn)
- Agrega colores semánticos a tailwind.config.ts

refactor: dividir componentes >100 líneas y hooks >150 líneas

- Divide 30 componentes grandes en subcomponentes
- Divide 4 hooks de notificaciones usando hook base compartido
- Elimina 20 usos de `any` sin justificación

feat: implementar errores personalizados TypeScript y validación Zod

- Crea core/errors/ con errores tipados por dominio
- Crea core/validators/ con schemas Zod
- Crea componente Dialog genérico reutilizable

fix(backend): corregir violaciones hexagonales y agregar DomainExceptions

- Refactoriza NotificationServices para usar ports de dominio
- Elimina Pageable de Spring del dominio puro
- Implementa 10 DomainExceptions específicas por entidad
- Agrega GlobalErrorHandler con formato problem+json

test(backend): agregar tests de use cases, controllers y dominio

- Agrega tests unitarios para modelos faltantes
- Agrega tests de use cases en application/
- Agrega tests de controllers en adapters/web/

chore: reorganizar estructura de carpetas (<10 archivos por directorio)

- Reorganiza backend por subdominio (product/, sale/, customer/, etc.)
- Reorganiza frontend core/ por subdominio
- Unifica estructura inconsistente de persistence/adapter/
```

---

## Notas

- ✅ Backend ya tiene DomainException base implementada
- ✅ Frontend usa correctamente TanStack Query y Zustand
- ✅ La regla de negocio `formatCurrency` ya existe en `shared/lib/utils.ts`
- ❌ NO hay un `ErrorWebExceptionHandler` global en backend
- ❌ NO hay schema de validación compartido (Zod)
- ❌ 2 services en backend rompen arquitectura hexagonal
- ⚠️ Los cambios de estructura de carpetas (Fases 12-14) requieren actualizar imports en muchos archivos. Hacerlos al final para minimizar conflictos.
- ⚠️ Correr `graphify update .` después del plan completo para mantener el grafo sincronizado.
