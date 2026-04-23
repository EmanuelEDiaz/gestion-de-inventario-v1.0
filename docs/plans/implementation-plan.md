# Plan de Implementación — Extensiones v2

Módulos: Imágenes de Clientes/Proveedores · Proveedor Extendido · Modo Fiar (Credit Sales) · Notificaciones Internas

> Ejecutar en orden. Cada etapa declara sus dependencias. No avanzar a la siguiente etapa sin que la actual pase sus criterios de aceptación.

---

## Etapa 1 — Migración de Base de Datos (Flyway V2)

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

## Etapa 2 — Modelos de Dominio (Java)

### Objetivo
Crear las clases de dominio puras (sin anotaciones de Spring ni JPA).

### Archivos a crear
```
backend/inventory-app/src/main/java/com/yourorg/inventory/domain/model/
  CustomerDebt.java
  DebtPayment.java
  Notification.java
  SupplierSocialLink.java
  SupplierCatalogProduct.java
  SyncIncident.java
```

### Archivos a modificar
```
domain/model/Customer.java         ← agregar List<CustomerImage> images
domain/model/Supplier.java         ← agregar website, List<SupplierImage>, List<SupplierSocialLink>, List<SupplierCatalogProduct>
domain/model/Sale.java             ← agregar PaymentMode paymentMode (enum: IMMEDIATE, CREDIT, RESERVE)
```

### Criterios de aceptación
- Compilar: `mvn compile -pl inventory-app` sin errores
- No hay dependencias de Spring/JPA en `domain/model/`

---

## Etapa 3 — Puertos de Repositorio (Java)

### Objetivo
Definir las interfaces de los repositorios (output ports).

### Archivos a crear
```
domain/ports/out/
  CustomerImageRepositoryPort.java
  SupplierImageRepositoryPort.java
  SupplierSocialLinkRepositoryPort.java
  SupplierCatalogProductRepositoryPort.java
  CustomerDebtRepositoryPort.java
  DebtPaymentRepositoryPort.java
  NotificationRepositoryPort.java
  NotificationReadRepositoryPort.java
  NotificationSinkPort.java          ← para SSE (push de nuevas notifs)
  SyncIncidentRepositoryPort.java
```

### Criterios de aceptación
- Compilar sin errores
- Todas las firmas de métodos retornan `Mono<T>` o `Flux<T>` (WebFlux reactivo)

---

## Etapa 4 — Casos de Uso (Java Application Layer)

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

## Etapa 5 — Adaptadores de Persistencia (Java)

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
    CustomerImageR2dbcRepo.java
    SupplierImageR2dbcRepo.java
    SupplierSocialLinkR2dbcRepo.java
    SupplierCatalogProductR2dbcRepo.java
    CustomerDebtR2dbcRepo.java
    DebtPaymentR2dbcRepo.java
    NotificationR2dbcRepo.java
    NotificationReadR2dbcRepo.java
    SyncIncidentR2dbcRepo.java
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
    NotificationSinkAdapter.java     ← Sinks.Many para SSE broadcast
```

### Criterios de aceptación
- Tests de integración con TestContainers (Postgres real)
- CRUD básico funcional para cada entidad

---

## Etapa 6 — Controladores Web (Java)

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

## Etapa 7 — Tests Backend

### Objetivo
Cobertura completa de los nuevos casos de uso y controladores.

### Tests a escribir
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

## Etapa 8 — Entidades Frontend (TypeScript Core)

### Objetivo
Definir los tipos de dominio en la capa core del frontend.

### Archivos a crear
```
frontend/src/core/entities/
  customer-debt.ts
  debt-payment.ts
  notification.ts
  sync-incident.ts
  upload-queue-entry.ts
```

### Archivos a modificar
```
frontend/src/core/entities/customer.ts    ← agregar images: ImageMetadata[]
frontend/src/core/entities/supplier.ts   ← agregar images, socialLinks, catalogProducts, website
frontend/src/core/entities/sale.ts       ← agregar paymentMode, debtId
```

### Criterios de aceptación
- `pnpm tsc --noEmit` sin errores en frontend/

---

## Etapa 9 — Infraestructura Frontend

### Objetivo
Implementar repositorios, stores de Dexie y clientes HTTP para los nuevos módulos.

### Archivos a crear
```
frontend/src/infrastructure/storage/
  dexie-db.ts                 ← MODIFICAR: agregar 4 nuevos stores (syncIncidents, uploadQueue, customerDebts, notifications)

frontend/src/infrastructure/repositories/
  CustomerDebtRepository.ts
  NotificationRepository.ts
  SyncIncidentRepository.ts
  UploadQueueRepository.ts

frontend/src/infrastructure/api/
  customer-debt-api.ts
  notification-api.ts
  sync-incident-api.ts
  image-upload-api.ts         ← con SHA-256 + Content-MD5 header

frontend/src/core/interfaces/
  ICustomerDebtRepository.ts
  INotificationRepository.ts
  ISyncIncidentRepository.ts
  IUploadQueueRepository.ts
```

### Nuevos stores Dexie
```typescript
// syncIncidents: '++id, operationId, entityType, incidentType, status, createdAt'
// uploadQueue: '++id, entityType, entityId, status, checksumSha256'
// customerDebts: 'id, customerId, status, dueDate'
// notifications: 'id, category, targetType, createdAt, [read+userId]'
```

### Criterios de aceptación
- `pnpm test:run` verde
- Upload con SHA-256 verificado: test con archivo real → Content-MD5 header correcto

---

## Etapa 10 — Módulo Clientes (Frontend)

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

## Etapa 11 — Módulo Proveedores (Frontend)

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

## Etapa 12 — Módulo Ventas y POS (Frontend)

### Objetivo
Implementar el flujo de fiado (CREDIT/RESERVE) en el POS y en la vista de ventas.

### Archivos a crear/modificar
```
frontend/src/presentation/modules/pos/
  components/
    FiarButton.tsx               ← dropdown: Crédito | Reserva
    CustomerSelector.tsx         ← buscador de clientes con autocompletado
    SaleConfirmSheet.tsx         ← bottom sheet de confirmación (COBRAR + FIAR)
  hooks/
    usePosCart.ts                ← MODIFICAR: agregar paymentMode, customerId, fiar flow
  views/
    PosView.tsx                  ← MODIFICAR: añadir FiarButton, CustomerSelector

frontend/src/presentation/modules/sales/
  views/
    SaleDetailView.tsx           ← MODIFICAR: mostrar paymentMode, link a deuda si debtId presente
```

### Criterios de aceptación (siguiendo pos-ux.md)
- Toque en "Fiar ▼" → muestra dropdown CREDIT/RESERVE
- Sin cliente seleccionado → botón FIAR deshabilitado con tooltip explicativo
- Con cliente → botón cambia a "FIAR a {nombre}"
- Confirmar venta CREDIT → GET /customers/{id}/debts muestra nueva deuda
- Confirmar venta RESERVE → stock.reserved aumenta (verificar en admin/stock)

---

## Etapa 13 — Módulo Deudas (Frontend)

### Objetivo
Crear la vista global de deudas `/admin/debts`.

### Archivos a crear
```
frontend/src/app/(admin)/debts/
  page.tsx

frontend/src/presentation/modules/debts/
  components/
    DebtRow.tsx
    DebtDetailPanel.tsx          ← acordeón con historial de pagos
    DebtUpdateForm.tsx           ← actualizar description/dueDate/notes
  hooks/
    useDebts.ts                  ← TanStack Query: GET /debts con filtros
    useDebtDetail.ts             ← GET /debts/{id}
    useUpdateDebt.ts             ← PATCH /debts/{id}
  views/
    DebtsListView.tsx            ← tabla con filtros (estado, vencimiento)
```

### Criterios de aceptación
- `/admin/debts` carga lista paginada con filtros de estado
- Clic en fila → expande historial de pagos
- Editar description/dueDate → PATCH actualiza
- Badge en sidebar muestra count de deudas PENDING + PARTIAL

---

## Etapa 14 — Módulo Notificaciones (Frontend)

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
