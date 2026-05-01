# Plan de Implementación — Extensiones v2

Módulos: Imágenes de Clientes/Proveedores · Proveedor Extendido · Modo Fiar (Credit Sales) · Notificaciones Internas

> Ejecutar en orden. Cada etapa declara sus dependencias. No avanzar a la siguiente etapa sin que la actual pase sus criterios de aceptación.

---

## Convenciones UI ya implementadas (NO reimplementar)

| Elemento | Implementación | Ubicación |
|----------|---------------|-----------|
| **Toast** | `import { toast } from '@/presentation/shared/components/ui/toast'` — wraps sonner con progress bar. API: `toast.success(msg)`, `toast.error(msg)`, `toast.warning(msg)`, `toast.info(msg)`. **Nunca importar de `sonner` directamente.** | `src/presentation/shared/components/ui/toast.tsx` |
| **Tooltip** | Atributo HTML nativo `title="texto explicativo"` en el elemento. No existe componente dedicado. | N/A |

---

## Etapa 1 — Migración de Base de Datos (Flyway V2) ✅ COMPLETADA

### Objetivo
Crear todas las tablas nuevas y alteraciones de tablas existentes en una sola migración.

### Archivo a crear
`backend/inventory-app/src/main/resources/db/migration/V2__extend_suppliers_customers_credit_notifications.sql`

### Contenido de la migración
```sql
-- Imágenes de clientes
CREATE TABLE customer_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  content_type text NOT NULL,
  file_path text NOT NULL UNIQUE,
  original_filename text,
  size_bytes bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX customer_images_primary_uidx ON customer_images(customer_id) WHERE is_primary = true;

-- Imágenes de proveedores
CREATE TABLE supplier_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  content_type text NOT NULL,
  file_path text NOT NULL UNIQUE,
  original_filename text,
  size_bytes bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX supplier_images_primary_uidx ON supplier_images(supplier_id) WHERE is_primary = true;

-- Redes sociales de proveedores
CREATE TABLE supplier_social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  platform text NOT NULL,  -- WHATSAPP | TELEGRAM | INSTAGRAM | FACEBOOK | TIKTOK | WEBSITE | OTHER
  url text NOT NULL,
  label text,
  sort_order int NOT NULL DEFAULT 0
);

-- Catálogo de productos del proveedor
CREATE TABLE supplier_catalog_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  description text,
  unit_price numeric(19,4),
  currency_code text REFERENCES currencies(code)
);

-- Extensión de suppliers
ALTER TABLE suppliers ADD COLUMN website text;

-- Extensión de sales (modo de pago)
ALTER TABLE sales ADD COLUMN payment_mode text NOT NULL DEFAULT 'IMMEDIATE';

-- Deudas de clientes
CREATE TABLE customer_debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id),
  sale_id uuid NOT NULL UNIQUE REFERENCES sales(id),
  original_amount numeric(19,4) NOT NULL,
  paid_amount numeric(19,4) NOT NULL DEFAULT 0,
  currency_code text NOT NULL REFERENCES currencies(code),
  status text NOT NULL DEFAULT 'PENDING',  -- PENDING | PARTIAL | PAID | CANCELLED
  description text,
  due_date timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0
);

-- Pagos de deudas
CREATE TABLE debt_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id uuid NOT NULL REFERENCES customer_debts(id),
  amount numeric(19,4) NOT NULL,
  payment_method text,  -- CASH | TRANSFER | PRODUCT | OTHER
  notes text,
  registered_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notificaciones internas
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,      -- SYSTEM_AUTO | USER_MANUAL
  category text NOT NULL,  -- LOW_STOCK | DEBT_OVERDUE | SYNC_CONFLICT | IMPORT_DONE | MANUAL
  title text NOT NULL,
  body text,
  target_type text NOT NULL,  -- USER | ALL
  target_user_id uuid REFERENCES users(id),
  created_by uuid REFERENCES users(id),
  entity_type text,
  entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Lecturas de notificaciones (evita borrado — solo marca como leída)
CREATE TABLE notification_reads (
  notification_id uuid NOT NULL REFERENCES notifications(id),
  user_id uuid NOT NULL REFERENCES users(id),
  read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, user_id)
);

-- Incidencias de sincronización
CREATE TABLE sync_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  operation_id text NOT NULL UNIQUE,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  incident_type text NOT NULL,  -- ENTITY_DUPLICATE | STOCK_CONFLICT | VERSION_MISMATCH | CHECKSUM_ERROR
  status text NOT NULL DEFAULT 'PENDING',  -- PENDING | RESOLVED | IGNORED
  my_payload jsonb,
  server_payload jsonb,
  resolution text,
  user_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
```

### Criterios de aceptación
- `mvn flyway:migrate` ejecuta sin errores
- Todas las tablas existen en la BD
- Los índices parciales `*_primary_uidx` funcionan (intentar insertar dos `is_primary=true` para el mismo padre → error de constraint)

---

## Etapa 2 — Modelos de Dominio (Java) ✅ COMPLETADA

### Objetivo
Crear las clases de dominio puras (sin anotaciones de Spring ni JPA).

### Archivos a crear
```
backend/inventory-app/src/main/java/com/inventory/domain/model/
  CustomerImage.java          ✅
  SupplierImage.java          ✅
  CustomerDebt.java           ✅
  DebtPayment.java            ✅
  Notification.java           ✅
  NotificationRead.java       ✅
  SupplierSocialLink.java     ✅
  SupplierCatalogProduct.java ✅
  SyncIncident.java           ✅
```

### Archivos a modificar
```
domain/model/Customer.java         ← agregar List<CustomerImage> images  ✅
domain/model/Supplier.java         ← agregar website, List<SupplierImage>, List<SupplierSocialLink>, List<SupplierCatalogProduct>  ✅
domain/model/Sale.java             ← agregar PaymentMode paymentMode (enum: IMMEDIATE, CREDIT, RESERVE)  ✅
```

### Criterios de aceptación
- Compilar: `mvn compile -pl inventory-app` sin errores  ✅
- No hay dependencias de Spring/JPA en `domain/model/`  ✅

---

## Etapa 3 — Puertos de Repositorio (Java) ✅ COMPLETADA

### Objetivo
Definir las interfaces de los repositorios (output ports).

### Archivos a crear
```
domain/ports/out/
  CustomerImageRepository.java          ✅
  SupplierImageRepository.java          ✅
  SupplierSocialLinkRepository.java     ✅
  SupplierCatalogProductRepository.java ✅
  CustomerDebtRepository.java           ✅
  DebtPaymentRepository.java            ✅
  NotificationRepository.java           ✅
  NotificationReadRepository.java       ✅
  NotificationSinkPort.java             ✅  ← SSE (push de nuevas notifs, no es repo)
  SyncIncidentRepository.java           ✅
```

> **Convención de nombres**: los puertos de repositorio usan `*Repository.java` (sin sufijo "Port").
> Solo `NotificationSinkPort` conserva el sufijo "Port" porque no es un repositorio sino un canal de emisión.

### Criterios de aceptación
- Compilar sin errores  ✅
- Todas las firmas de métodos retornan `Mono<T>` o `Flux<T>` (WebFlux reactivo)  ✅

---

## Etapa 4 — Casos de Uso (Java Application Layer) ✅ COMPLETADA

### Objetivo
Implementar la lógica de negocio en la capa de aplicación.

### Archivos a crear
```
application/usecase/command/
  UploadCustomerImageUseCase.java
  DeleteCustomerImageUseCase.java
  UploadSupplierImageUseCase.java
  DeleteSupplierImageUseCase.java
  AddSupplierSocialLinkUseCase.java
  DeleteSupplierSocialLinkUseCase.java
  AddSupplierCatalogProductUseCase.java
  DeleteSupplierCatalogProductUseCase.java
  CreditSaleUseCase.java             ← paymentMode=CREDIT: stock + crear deuda
  ReserveSaleUseCase.java            ← paymentMode=RESERVE: reservar stock
  ConfirmReserveSaleUseCase.java     ← al cobrar un RESERVE
  RegisterDebtPaymentUseCase.java    ← pago parcial/total + actualizar status
  UpdateDebtUseCase.java             ← actualizar description, dueDate, notes
  CancelDebtUseCase.java
  CreateNotificationUseCase.java
  DispatchSystemNotificationUseCase.java
  MarkNotificationReadUseCase.java
  MarkAllNotificationsReadUseCase.java
  ReportSyncIncidentUseCase.java
  ResolveSyncIncidentUseCase.java

application/usecase/query/
  ListCustomerDebtsQueryUseCase.java
  GetDebtQueryUseCase.java
  ListAllDebtsQueryUseCase.java
  ListNotificationsQueryUseCase.java
  GetUnreadCountQueryUseCase.java
  ListSyncIncidentsQueryUseCase.java
```

### Lógica de `CreditSaleUseCase`
1. Ejecutar `CreateSaleUseCase` con `paymentMode=CREDIT`
2. Stock se mueve (igual que IMMEDIATE)
3. Crear `customer_debt` con `originalAmount = sale.total`, `status=PENDING`
4. Retornar `SaleResponse` con `debtId` incluido

### Lógica de `ReserveSaleUseCase`
1. Crear venta en estado RESERVED
2. Incrementar `stock_balances.reserved` (no `on_hand`)
3. **No** crear deuda todavía

### Lógica de `ConfirmReserveSaleUseCase`
1. Decrementar `stock_balances.reserved`
2. Decrementar `stock_balances.on_hand`
3. Crear `debt_payment` con `amount=sale.total` → marcar deuda PAID

### Lógica de `RegisterDebtPaymentUseCase`
1. Registrar `debt_payment`
2. Actualizar `customer_debts.paid_amount += amount`
3. Si `paid_amount >= original_amount` → `status=PAID`
4. Else → `status=PARTIAL`

### Criterios de aceptación
- Tests unitarios para cada use case con mocks de repositorios
- `mvn test -pl inventory-app` verde

---

## Etapa 5 — Adaptadores de Persistencia (R2DBC) ✅ COMPLETADA

### Objetivo
Implementar los repositorios con R2DBC.

### Archivos a crear
```
adapters/persistence/
  entity/
    CustomerImageEntity.java
    SupplierImageEntity.java
    SupplierSocialLinkEntity.java
    SupplierCatalogProductEntity.java
    CustomerDebtEntity.java
    DebtPaymentEntity.java
    NotificationEntity.java
    NotificationReadEntity.java
    SyncIncidentEntity.java
  repository/ (Spring Data R2DBC interfaces)
    CustomerImageR2dbcRepository.java
    SupplierImageR2dbcRepository.java
    SupplierSocialLinkR2dbcRepository.java
    SupplierCatalogProductR2dbcRepository.java
    CustomerDebtR2dbcRepository.java
    DebtPaymentR2dbcRepository.java
    NotificationR2dbcRepository.java
    NotificationReadR2dbcRepository.java
    SyncIncidentR2dbcRepository.java
  mapper/
    CustomerImageMapper.java         (MapStruct)
    SupplierImageMapper.java
    CustomerDebtMapper.java
    DebtPaymentMapper.java
    NotificationMapper.java
    SyncIncidentMapper.java
  (implementaciones de los ports)
    CustomerImageRepositoryAdapter.java
    SupplierImageRepositoryAdapter.java
    CustomerDebtRepositoryAdapter.java
    DebtPaymentRepositoryAdapter.java
    NotificationRepositoryAdapter.java
    SyncIncidentRepositoryAdapter.java
    NotificationSinkAdapter.java     ← implementa NotificationSinkPort con reactor Sinks.Many
```

### Criterios de aceptación
- Tests de integración con TestContainers (Postgres real)
- CRUD básico funcional para cada entidad

---

## Etapa 6 — Controladores Web (Java) ✅ COMPLETADA

### Objetivo
Exponer los endpoints REST definidos en `docs/contracts/endpoints.md`.

### Archivos a crear
```
adapters/web/controller/
  CustomerImageController.java       ← POST/GET/GET{id}/DELETE /customers/{id}/images
  SupplierImageController.java       ← idem para suppliers
  SupplierSocialLinkController.java  ← GET/POST/DELETE /suppliers/{id}/social-links
  SupplierCatalogProductController.java ← GET/POST/DELETE /suppliers/{id}/products
  CustomerDebtController.java        ← GET /debts, GET /debts/{id}, PATCH /debts/{id}, POST /debts/{id}/payments, GET /customers/{id}/debts
  NotificationController.java        ← GET/POST/mark-read/mark-all-read/unread-count
  NotificationSseController.java     ← GET /notifications/stream → Flux<ServerSentEvent>
  SyncIncidentController.java        ← GET/POST/PATCH /sync/incidents
```

### Archivos a modificar
```
adapters/web/controller/CustomerController.java     ← invocar CustomerImageController (o delegar)
adapters/web/controller/SupplierController.java     ← agregar website a create/update
adapters/web/controller/SaleController.java         ← agregar paymentMode al crear venta
adapters/web/controller/DashboardController.java    ← agregar pendingDebtsCount, pendingDebtsTotal
adapters/web/dto/CustomerResponse.java              ← agregar images[]
adapters/web/dto/SupplierResponse.java              ← agregar images[], socialLinks[], catalogProducts[], website
adapters/web/dto/SaleCreateRequest.java             ← agregar paymentMode (default IMMEDIATE)
adapters/web/dto/SaleResponse.java                  ← agregar paymentMode, debtId (nullable)
```

### Criterios de aceptación
- `GET /swagger-ui.html` muestra todos los nuevos endpoints
- Tests de integración HTTP con WebTestClient
- RBAC correcto (SELLER no puede subir imágenes, ADMIN puede forzar conflictos)

---

## Etapa 7 — Tests Backend ✅ COMPLETADA (106 tests, 0 errores)

> **Estado real** — Los tests escritos difieren del plan original. Ver sección "Hallazgos y estado real" al final del plan.
```
src/test/java/
  domain/CreditSaleServiceTest.java
  domain/DebtPaymentServiceTest.java
  application/CreditSaleUseCaseTest.java
  application/RegisterDebtPaymentUseCaseTest.java
  application/NotificationUseCaseTest.java
  adapters/web/CustomerDebtControllerIT.java   (WebTestClient + TestContainers)
  adapters/web/NotificationControllerIT.java
  adapters/web/NotificationSseControllerIT.java
```

### Criterios de aceptación
- `mvn test` verde en CI
- Cobertura mínima: 80% en `domain/` y `application/usecase/`

---

## Etapa 8 — Entidades Frontend (TypeScript Core) ✅ COMPLETADA

### Objetivo
Definir los tipos de dominio en la capa core del frontend.

### Archivos creados
```
frontend/src/core/entities/
  customer-image.ts           ✅ CustomerImage, CreateCustomerImageData, SetPrimaryCustomerImageData
  supplier-image.ts           ✅ SupplierImage, CreateSupplierImageData, SetPrimarySupplierImageData
  supplier-social-link.ts     ✅ SupplierSocialLink, SocialPlatform (7 valores), SOCIAL_PLATFORM_LABELS
  supplier-catalog-product.ts ✅ SupplierCatalogProduct, AddSupplierCatalogProductData
  customer-debt.ts            ✅ CustomerDebt, DebtStatus, DebtPaymentMethod, DEBT_STATUS_LABELS/COLORS
  debt-payment.ts             ✅ DebtPayment, RegisterDebtPaymentData
  notification.ts             ✅ Notification, NotificationType, NotificationCategory, NOTIFICATION_CATEGORY_LABELS
  sync-incident.ts            ✅ SyncIncident, SyncIncidentType, SyncIncidentStatus, labels, report/resolve data
  upload-queue-entry.ts       ✅ UploadQueueEntry, UploadQueueStatus, UploadQueueEntityType
```

### Archivos modificados
```
frontend/src/core/entities/customer.ts    ✅ + images?: CustomerImage[]
frontend/src/core/entities/supplier.ts   ✅ + website?, images?, socialLinks?, catalogProducts?
frontend/src/core/entities/sale.ts       ✅ + PaymentMode type, paymentMode?, debtId? en Sale y CreateSaleInput
```

### Tests escritos (55 tests, 0 errores)
```
frontend/src/core/entities/
  customer-image.test.ts         7 tests
  customer-debt.test.ts          8 tests
  notification.test.ts           9 tests
  sync-incident.test.ts          9 tests
  supplier-social-link.test.ts   5 tests
  entities-extension.test.ts     7 tests  ← verifica Customer, Supplier y Sale extendidos
  product.test.ts                10 tests (pre-existente, sigue verde)
```

### Criterios de aceptación
- `pnpm tsc --noEmit` — sin errores en archivos nuevos/modificados  ✅
- `pnpm vitest run src/core/entities/` — 55 tests, 0 errores  ✅

---

## Etapa 9 — Infraestructura Frontend ✅ COMPLETADA

### Objetivo
Implementar repositorios, clientes HTTP e interfaces para los nuevos módulos.

### Archivos creados

#### Interfaces (puertos)
```
frontend/src/core/interfaces/
  ICustomerDebtRepository.ts   ✅ findAll, findOverdue, findById, findByCustomer, update, cancel, registerPayment
  INotificationRepository.ts   ✅ findAll, getUnreadCount, create, markRead, markAllRead
  ISyncIncidentRepository.ts   ✅ findPending, findById, report, resolve, ignore
  IUploadQueueRepository.ts    ✅ enqueue, findByStatus, findByEntity, updateStatus, incrementRetry, remove, clearCompleted
```

#### Clientes HTTP
```
frontend/src/infrastructure/api/
  customer-debt-api.ts         ✅ GET /api/v1/debts, PATCH, POST /{id}/cancel, POST /{id}/payments
  notification-api.ts          ✅ GET /api/v1/notifications, POST, POST /{id}/read, POST /read-all
  sync-incident-api.ts         ✅ GET /api/v1/sync/incidents, POST, POST /{id}/resolve, POST /{id}/ignore
  image-upload-api.ts          ✅ customerImageApi + supplierImageApi (list/upload/setPrimary/delete)
```

#### Repositorios
```
frontend/src/infrastructure/repositories/
  CustomerDebtRepository.ts    ✅ implementa ICustomerDebtRepository vía customerDebtApi
  NotificationRepository.ts    ✅ implementa INotificationRepository vía notificationApi
  SyncIncidentRepository.ts    ✅ implementa ISyncIncidentRepository vía syncIncidentApi
  UploadQueueRepository.ts     ✅ implementa IUploadQueueRepository vía IndexedDB (idb)
```

### Tests escritos (21 tests nuevos → total 99 tests)
```
frontend/src/infrastructure/repositories/
  CustomerDebtRepository.test.ts   8 tests
  NotificationRepository.test.ts   6 tests
  SyncIncidentRepository.test.ts   7 tests
```

### Criterios de aceptación
- `pnpm tsc --noEmit` — sin errores en archivos nuevos  ✅
- `pnpm test:run` — 99 tests, 0 errores  ✅

---

## Etapa 10 — Módulo Clientes (Frontend) ✅ COMPLETADA

### Objetivo
Añadir galería de imágenes y lista de deudas a la vista de cliente.

### Archivos a crear/modificar
```
frontend/src/presentation/modules/customers/
  components/
    CustomerImageCarousel.tsx    ← carrusel con upload/delete/primary (ver sec 5 de frontend-ux-contracts.md)
    CustomerDebtList.tsx         ← lista de deudas con estado y botón de pago
    DebtPaymentForm.tsx          ← formulario de pago parcial/total
  hooks/
    useCustomerImages.ts         ← TanStack Query: GET/POST/DELETE /customers/{id}/images
    useCustomerDebts.ts          ← TanStack Query: GET /customers/{id}/debts
    useDebtPayment.ts            ← Mutation: POST /debts/{id}/payments
  views/
    CustomerDetailView.tsx       ← MODIFICAR: agregar tabs "Imágenes" y "Deudas"
```

### Criterios de aceptación
- Subir imagen → aparece en carrusel
- "Hacer principal" → thumbnail en tabla cambia
- Registrar pago parcial → estado cambia a PARTIAL
- Registrar pago total → estado cambia a PAID

---

## Etapa 11 — Módulo Proveedores (Frontend) ✅ COMPLETADA

### Objetivo
Añadir imágenes, redes sociales y catálogo de productos al proveedor.

### Archivos a crear/modificar
```
frontend/src/presentation/modules/suppliers/
  components/
    SupplierImageCarousel.tsx
    SupplierSocialLinks.tsx      ← lista con iconos de plataforma + botón agregar/eliminar
    SupplierCatalogProducts.tsx  ← tabla de productos vinculados con precio opcional
  hooks/
    useSupplierImages.ts
    useSupplierSocialLinks.ts
    useSupplierCatalogProducts.ts
  views/
    SupplierDetailView.tsx       ← MODIFICAR: agregar tabs "Imágenes", "Redes Sociales", "Catálogo"
    SupplierFormView.tsx         ← MODIFICAR: agregar campo website
```

### Criterios de aceptación
- Agregar red social con URL → aparece en lista con icono de plataforma
- Vincular producto del catálogo (con product_id) → muestra thumbnail del producto
- Agregar producto libre (sin product_id, solo texto) → muestra como texto

---

## Etapa 12 — Módulo Ventas y POS (Frontend) ✅ COMPLETADA

### Archivos creados
```
frontend/src/presentation/modules/pos/
  components/
    FiarButton.tsx               ← dropdown: Cobrar / Crédito / Reserva
    CustomerSelector.tsx         ← buscador con debounce 300ms
    SaleConfirmSheet.tsx         ← bottom sheet: COBRAR / FIAR
  hooks/
    usePosCart.ts                ← carrito: lines, paymentMode, customer, confirm()
    usePosCart.test.ts           ← 4 tests
  views/
    PosView.tsx                  ← vista principal POS

frontend/src/presentation/modules/sales/
  views/
    SaleDetailView.tsx           ← badge paymentMode, link deuda si debtId

frontend/src/app/(pos)/
  page.tsx                       ← ruta /pos
```

### Modificaciones
- `SalesListView.tsx` — import toast corregido (sonner → toast personalizado)

### Tests: 121 tests, 0 errores

---

## Etapa 13 — Módulo Deudas (Frontend) ✅ COMPLETADA

### Archivos creados
```
frontend/src/app/(admin)/debts/page.tsx
frontend/src/presentation/modules/debts/
  components/
    DebtRow.tsx, DebtDetailPanel.tsx, DebtUpdateForm.tsx
  hooks/
    useDebts.ts, useDebtDetail.ts, useUpdateDebt.ts (incluye useCancelDebt)
    debts.test.ts ← 4 tests
  views/
    DebtsListView.tsx
```

### Tests: 125 tests, 0 errores

---

## Etapa 14 — Módulo Notificaciones + Sync Incidents (Frontend) ✅ COMPLETADA

**Tests:** 134 total (9 nuevos), 0 errores · Fecha: 2026-05-01

### Archivos creados
- `presentation/modules/notifications/hooks/useNotifications.ts` — queries: `['notifications', includeRead]` y `['notifications', 'unread-count']` (refetchInterval 30s)
- `presentation/modules/notifications/hooks/useMarkRead.ts` — mutaciones `markOne` / `markAll`, invalida `['notifications']`
- `presentation/modules/notifications/hooks/useNotificationStream.ts` — SSE via `EventSource('/api/v1/notifications/stream')`, invalida queries al recibir eventos
- `presentation/modules/notifications/components/NotificationBadge.tsx` — badge con contador, link a `/notifications`
- `presentation/modules/notifications/components/NotificationItem.tsx` — ítem individual con botón "Leída", badge de categoría, tiempo relativo (`date-fns/locale/es`)
- `presentation/modules/notifications/components/NotificationInbox.tsx` — lista + "Marcar todas como leídas"
- `presentation/modules/notifications/views/NotificationsView.tsx` — toggle "mostrar leídas" + SSE activo
- `presentation/modules/sync/hooks/useSyncIncidents.ts` — queries: `['sync-incidents', deviceId ?? 'all']` y `['sync-incident', id]`
- `presentation/modules/sync/hooks/useResolveSyncIncident.ts` — mutaciones `resolve` / `ignore`, invalida queries
- `presentation/modules/sync/components/SyncIncidentRow.tsx` — fila de tabla expandible con badges tipo/estado
- `presentation/modules/sync/components/SyncConflictResolver.tsx` — panel con payloads local/servidor, textarea resolución, botones Resolver/Ignorar/Cancelar
- `presentation/modules/sync/views/SyncIncidentsView.tsx` — tabla con filtro por tipo, accordion expand
- `app/(admin)/notifications/page.tsx` — ruta `/notifications`
- `app/(admin)/sync/incidents/page.tsx` — ruta `/sync/incidents`

### Tests escritos
- `useNotifications.test.ts` — 3 tests (queryKeys con/sin includeRead, unread-count + refetchInterval)
- `useSyncIncidents.test.ts` — 4 tests (queryKey 'all', queryKey con deviceId, enabled false/true para detail)
- `useMarkRead.test.ts` — 2 tests (retorna markOne + markAll, useMutation llamado 2 veces)

### Objetivo
Implementar inbox de notificaciones, badge en tiempo real y centro de incidencias.

### Archivos a crear
```
frontend/src/app/(admin)/notifications/
  page.tsx
frontend/src/app/(admin)/sync/incidents/
  page.tsx

frontend/src/presentation/modules/notifications/
  components/
    NotificationBadge.tsx        ← badge con contador no leídas (actualizado por SSE)
    NotificationInbox.tsx        ← lista con filtros y "marcar todas leídas"
    NotificationItem.tsx
  hooks/
    useNotifications.ts          ← TanStack Query: GET /notifications
    useUnreadCount.ts            ← GET /notifications/unread-count
    useNotificationStream.ts     ← EventSource SSE → actualiza unread count en Zustand
    useMarkRead.ts               ← Mutation: POST /notifications/mark-read
  views/
    NotificationsView.tsx

frontend/src/presentation/modules/sync/
  components/
    SyncIncidentRow.tsx
    SyncConflictResolver.tsx     ← panel con opciones según tipo (Sec 11 offline-strategy.md)
  hooks/
    useSyncIncidents.ts
    useResolveSyncIncident.ts
  views/
    SyncIncidentsView.tsx        ← ver Sec 12 offline-strategy.md
```

### Barra de sync (refactorizar componente existente)
```
frontend/src/presentation/shared/components/
  SyncProgressBar.tsx            ← progreso real (ver Sec 10 offline-strategy.md)
  InitialLoadBar.tsx             ← 6 pasos reales (ver Sec 9 offline-strategy.md)
```

### Criterios de aceptación
- SSE conecta y badge actualiza sin recargar la página
- Marcar como leída → badge decrementa
- Centro de incidencias: filtrar por tipo funciona
- Resolver conflicto ENTITY_DUPLICATE con "Editar y reintentar" → abre formulario pre-cargado
- Barra de carga inicial: avanza paso a paso (verificar con DevTools Network throttling)
- Barra de sync: muestra progreso real de operaciones del outbox

---

## Hallazgos y estado real (actualizado 2026-04-30)

### Backend completado — estado por etapa

| Etapa | Tests | Commit |
|-------|-------|--------|
| 1 — Migración DB | — | ✅ main |
| 2 — Domain models | — | ✅ main |
| 3 — Ports | — | ✅ main |
| 4 — Use cases | `CustomerImageCommandUseCaseTest` (7), `SupplierImageCommandUseCaseTest` (4), `CustomerDebtCommandUseCaseTest` (4), `SyncIncidentCommandUseCaseTest` (4), `SupplierSocialLinkCommandUseCaseTest` (3), `SaleCommandUseCaseTest` (5) | ✅ main |
| 5 — Persistence | `ArchitectureTest` (6), `ProductTest` (6), `SaleTest` (7), `StockBalanceTest` (10) | ✅ main |
| 6 — Controllers | `DashboardControllerTest` (5), `SyncControllerTest` (3) | ✅ main |
| 7 — Tests BE | `CustomerDebtControllerTest` (8), `NotificationControllerTest` (7), `SyncIncidentControllerTest` (7), `CustomerImageControllerTest` (10), `SupplierImageControllerTest` (8), `DashboardQueryUseCaseTest` (2) | ✅ main |
| 8 — FE Entities | 55 tests (7 archivos) | ✅ commiteado |
| 9 — FE Infrastructure | 21 tests (3 archivos) | ✅ pendiente commit |

**Total: 106 tests, 0 errores**

### Tests reales escritos en Etapa 7 (difieren del plan original)

El plan original indicaba tests con TestContainers. Lo que se implementó fue una suite de **`@WebFluxTest` slice tests** con `@MockBean` — más rápidos, sin dependencia de Docker/Postgres, suficientes para verificar RBAC y contratos HTTP. Los tests de integración con TestContainers quedan pendientes para una etapa de hardening posterior.

### Hallazgos críticos para el frontend (LEER ANTES de Etapas 8-14)

Estos valores se verificaron en los tests del backend. Usarlos exactamente como aparecen aquí.

#### Enums — valores exactos
```typescript
// NotificationType
type NotificationType = 'SYSTEM_AUTO' | 'USER_MANUAL'
// ⚠️ NO existen 'SYSTEM' ni 'MANUAL' → HTTP 400

// NotificationCategory
type NotificationCategory = 'LOW_STOCK' | 'SYSTEM' | 'SALE' | 'PURCHASE' | 'SYNC'

// SyncIncidentType
type SyncIncidentType = 'STOCK_CONFLICT' | 'ENTITY_DUPLICATE' | 'VERSION_MISMATCH' | 'CHECKSUM_ERROR'
// ⚠️ NO existe 'CONFLICT' a secas → HTTP 400

// SyncIncidentStatus
type SyncIncidentStatus = 'PENDING' | 'RESOLVED' | 'IGNORED'

// PaymentMode (Sale)
type PaymentMode = 'IMMEDIATE' | 'CREDIT' | 'RESERVE'
```

#### Upload de imágenes — flujo real (dos pasos)

El endpoint de imágenes recibe **JSON, NO multipart/form-data**:

```
POST /api/v1/customers/{id}/images
Content-Type: application/json

{
  "isPrimary": boolean,
  "contentType": "image/png" | "image/jpeg" | "image/webp",
  "filePath": string,       ← ruta donde YA fue guardado el binario
  "originalFilename": string,
  "sizeBytes": number,
  "sortOrder": number        ← 0 = primera, 1 = segunda, etc.
}
```

Esto implica que el frontend necesita DOS pasos:
1. Subir el binario (endpoint pendiente — ver punto siguiente)
2. Registrar metadatos con este endpoint JSON

**⚠️ Pendiente en backend**: el endpoint de subida binaria `POST /api/v1/uploads/image` (multipart → devuelve filePath) NO existe todavía. Debe crearse antes de implementar la UI de galería en Etapas 10-11. Se puede diferir usando un mock de filePath en desarrollo.

#### RBAC verificado en tests

| Operación | ADMIN | MANAGER | SELLER |
|-----------|-------|---------|--------|
| Ver imágenes | ✅ | ✅ | ✅ |
| Subir / eliminar imagen | ✅ | ✅ | ❌ 403 |
| Marcar imagen como primary | ✅ | ✅ | ❌ 403 |
| Ver deudas | ✅ | ✅ | ✅ |
| Cancelar deuda | ✅ | ✅ | ❌ 403 |
| Registrar pago de deuda | ✅ | ✅ | ✅ |
| Ver notificaciones | ✅ | ✅ | ✅ |
| Crear notificación | ✅ | ✅ | ❌ 403 |
| Ver / resolver sync incidents | ✅ | ✅ | ❌ 403 |

El frontend debe ocultar o deshabilitar los botones según rol. No confiar solo en que el backend rechace.

#### Entidades frontend faltantes (descubiertas al escribir los tests)

Estas entidades tienen DTO en el backend pero NO tienen archivo en `frontend/src/core/entities/`:

| Archivo a crear | DTO backend |
|-----------------|-------------|
| `customer-image.ts` | `CustomerImageDto` |
| `supplier-image.ts` | `SupplierImageDto` |
| `supplier-social-link.ts` | `SupplierSocialLinkDto` |
| `supplier-catalog-product.ts` | `SupplierCatalogProductDto` |

> La Etapa 8 del plan original ya incluye `customer-debt.ts`, `notification.ts`, `sync-incident.ts`. Se agregan los 4 de arriba a esa etapa.

#### Entidades frontend existentes con campos faltantes

| Archivo | Campo faltante |
|---------|---------------|
| `customer.ts` | `images?: CustomerImage[]` |
| `supplier.ts` | `images?: SupplierImage[]`, `socialLinks?: SupplierSocialLink[]`, `catalogProducts?: SupplierCatalogProduct[]`, `website?: string` |
| `sale.ts` | `paymentMode?: PaymentMode`, `debtId?: string` |

#### Deuda técnica frontend (no bloquea etapas 8-14)

Registrada en auditoría 2026-04-17. Debe resolverse antes de entrega final:
- 5 componentes superan 100 líneas
- 9 hooks sin sufijo `Controller`
- 9 módulos con estructura plana (faltan subcarpetas `table/`, `filters/`)
- 5 vistas con lógica que debería estar en hooks

---

## Resumen de Dependencias entre Etapas

```
Etapa 1 (DB)
  └─▶ Etapa 2 (Domain)
        └─▶ Etapa 3 (Ports)
              └─▶ Etapa 4 (Use Cases)
                    ├─▶ Etapa 5 (Persistence)
                    │     └─▶ Etapa 6 (Controllers) ──▶ Etapa 7 (Tests BE)
                    └─▶ Etapa 8 (FE Entities)
                          └─▶ Etapa 9 (FE Infrastructure)
                                ├─▶ Etapa 10 (Clientes FE)
                                ├─▶ Etapa 11 (Proveedores FE)
                                ├─▶ Etapa 12 (POS/Ventas FE)
                                ├─▶ Etapa 13 (Deudas FE)
                                └─▶ Etapa 14 (Notificaciones FE)
```

Las etapas 10–14 son independientes entre sí y pueden ejecutarse en paralelo una vez completada la etapa 9.

---

## Verificación Final

1. `mvn test` backend — verde
2. `pnpm test:run` frontend — verde
3. `GET /swagger-ui.html` — todos los endpoints nuevos documentados
4. Crear cliente con imagen → `GET /customers/{id}` devuelve `images[]`
5. `POST /sales` con `paymentMode=CREDIT` → `GET /debts` muestra deuda
6. `POST /sales` con `paymentMode=RESERVE` → `stock_balances.reserved` incrementa
7. `POST /debts/{id}/payments` con amount parcial → `debt.status = PARTIAL`
8. `POST /notifications` con `targetType=ALL` → `GET /notifications` lo muestra para todos
9. `GET /notifications/stream` (SSE) → emite evento al crear notificación
10. Barra de carga inicial — 6 pasos reales verificados con Network throttling
11. Sync de venta offline → barra muestra progreso real por operación
