# DTOs y Mappers

## Reglas

- DTOs web (`adapters/web/dto`) NO se reutilizan como dominio
- Mappers con **MapStruct**
- Errores en formato `application/problem+json`

## Product

```typescript
// Request
ProductCreateRequest {
  sku?: string
  barcode?: string
  name: string
  description?: string
  categoryId?: string
  standardCost?: number
  reorderPoint?: number
  currencyCode: string
}

ProductUpdateRequest {
  name?: string
  description?: string
  categoryId?: string
  status?: 'ACTIVE' | 'ARCHIVED'
  standardCost?: number
  reorderPoint?: number
  barcode?: string
}

// Response
ProductResponse {
  id: string
  sku?: string
  barcode?: string
  name: string
  description?: string
  categoryId?: string
  status: string
  standardCost?: number
  reorderPoint?: number
  currencyCode: string
  images: ImageMetadata[]
  version: number
}
```

## Sale

```typescript
SaleCreateRequest {
  idempotencyKey: string
  warehouseId: string
  customerId?: string
  currencyCode: string
  exchangeRateId?: string
  soldAt?: string
  notes?: string
  lines: SaleLineRequest[]
}

SaleLineRequest {
  productId: string
  qty: number
  unitPrice: number
}

SaleResponse {
  id: string
  warehouseId: string
  customerId?: string
  status: string
  soldAt: string
  totals: { revenue: number, cost: number, profit: number }
  currencyCode: string
  notes?: string
  lines: SaleLine[]
  createdBy: string
  createdAt: string
  version: number
}
```

## Purchase

```typescript
PurchaseCreateRequest {
  idempotencyKey: string
  warehouseId: string
  supplierId?: string
  currencyCode: string
  exchangeRateId?: string
  purchasedAt?: string
  notes?: string
  lines: PurchaseLineRequest[]
}

PurchaseLineRequest {
  productId: string
  qty: number
  unitCost: number
}

PurchaseResponse {
  id: string
  warehouseId: string
  supplierId?: string
  status: string
  purchasedAt: string
  totalCost: number
  currencyCode: string
  notes?: string
  lines: PurchaseLine[]
  createdBy: string
  createdAt: string
  version: number
}
```

## Transfer

```typescript
TransferCreateRequest {
  idempotencyKey: string
  sourceWarehouseId: string
  targetWarehouseId: string
  notes?: string
  lines: TransferLineRequest[]
}

TransferLineRequest {
  productId: string
  qty: number
}

TransferResponse {
  id: string
  sourceWarehouseId: string
  targetWarehouseId: string
  status: string
  notes?: string
  lines: TransferLine[]
  createdBy: string
  createdAt: string
  version: number
}
```

## Adjustment

```typescript
AdjustmentCreateRequest {
  idempotencyKey: string
  warehouseId: string
  adjustmentType: 'STOCK_COUNT' | 'DAMAGE' | 'CORRECTION' | 'OTHER'
  reason: string
  lines: AdjustmentLineRequest[]
}

AdjustmentLineRequest {
  productId: string
  qtyChange: number  // positivo = entrada, negativo = salida
  unitCost?: number
}

AdjustmentResponse {
  id: string
  warehouseId: string
  adjustmentType: string
  reason: string
  status: string
  lines: AdjustmentLine[]
  createdBy: string
  createdAt: string
  version: number
}
```

## Return

```typescript
ReturnCreateRequest {
  idempotencyKey: string
  warehouseId: string
  returnType: 'RETURN_FROM_CUSTOMER' | 'RETURN_TO_SUPPLIER'
  sourceDocId?: string
  customerId?: string
  supplierId?: string
  currencyCode: string
  exchangeRateId?: string
  notes?: string
  lines: ReturnLineRequest[]
}

ReturnLineRequest {
  productId: string
  qty: number
  unitCost: number
  unitPrice?: number
  sourceLineId?: string
}

ReturnResponse {
  id: string
  warehouseId: string
  returnType: string
  status: string
  sourceDocType?: string
  sourceDocId?: string
  lines: ReturnLine[]
  createdBy: string
  createdAt: string
  version: number
}
```

## Supplier / Customer

```typescript
SupplierCreateRequest {
  name: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

SupplierUpdateRequest {
  name?: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  isActive?: boolean
}

SupplierResponse {
  id: string
  name: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  isActive: boolean
  createdAt: string
  version: number
}

// CustomerRequest/Response similar
```

## Warehouse / Category

```typescript
WarehouseCreateRequest { code: string, name: string }
WarehouseUpdateRequest { name?: string, isActive?: boolean }
WarehouseResponse { id, code, name, isActive, createdAt, version }

CategoryCreateRequest { name: string, parentId?: string }
CategoryUpdateRequest { name?: string, parentId?: string }
CategoryResponse { id, name, parentId?, path?, children[]?, createdAt, version }
```

## Currency / Exchange Rate

```typescript
CurrencyCreateRequest { code: string, name: string, symbol?: string }
CurrencyUpdateRequest { name?: string, symbol?: string, isActive?: boolean }
CurrencyResponse { code, name, symbol?, isActive }

ExchangeRateCreateRequest {
  baseCode: string
  quoteCode: string
  rate: number
  rateType: 'OFFICIAL' | 'MARKET' | 'CUSTOM'
  validFrom: string
}

ExchangeRateResponse { id, baseCode, quoteCode, rate, rateType, validFrom, createdBy, createdAt }
```

## Settings

```typescript
AppSettingsResponse {
  defaultCostMethod: 'STANDARD' | 'WAC' | 'FIFO'
  defaultCurrencyCode: string
  companyName?: string
  lowStockThresholdDefault?: number
  version: number
}

AppSettingsUpdateRequest {
  defaultCostMethod?: string
  defaultCurrencyCode?: string
  companyName?: string
  lowStockThresholdDefault?: number
}
```

## Sync

```typescript
SyncPushRequest {
  deviceId: string
  lastKnownCursor?: number
  operations: SyncOperation[]
}

SyncOperation {
  operationId: string
  entityId: string
  type: string
  occurredAt: string
  payload: object
  expectedVersion?: number
}

SyncPushResponse {
  acceptedOperationIds: string[]
  rejected: { operationId: string, reason: string, details?: object }[]
  newCursor: number
}

SyncPullResponse {
  cursor: number
  changes: Change[]
}
```

## Error Response

```typescript
ProblemResponse {
  type: string
  title: string
  status: number
  detail: string
  instance: string
  errorCode?: string
  fieldErrors?: { field: string, message: string }[]
}
```

---

## ImageMetadata (tipo compartido — aplica a products, customers, suppliers, users)

```typescript
ImageMetadata {
  id: string
  sortOrder: number
  isPrimary: boolean
  contentType: string
  sizeBytes: number
  url: string        // /api/v1/{entity}/{id}/images/{imgId}
  thumbUrl: string   // ?variant=thumb256
  createdAt: string
}
```

---

## Customer (extendido)

```typescript
CustomerCreateRequest {
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

CustomerUpdateRequest {
  name?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  isActive?: boolean
}

CustomerResponse {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  isActive: boolean
  images: ImageMetadata[]       // lista vacia si no tiene imagenes
  createdAt: string
  version: number
}

// Upload -- multipart/form-data
CustomerImageUploadRequest {
  file: File                    // max 5 MiB; image/jpeg | image/png | image/webp
  isPrimary?: boolean           // default: false. Si true, se desmarca la anterior principal
  sortOrder?: number            // default: 0
}
```

---

## Supplier (extendido)

```typescript
SupplierCreateRequest {
  name: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  website?: string              // URL principal (opcional)
}

SupplierUpdateRequest {
  name?: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  isActive?: boolean
  website?: string
}

SupplierResponse {
  id: string
  name: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  website?: string
  isActive: boolean
  images: ImageMetadata[]
  socialLinks: SupplierSocialLink[]
  catalogProducts: SupplierCatalogProduct[]
  createdAt: string
  version: number
}

SupplierSocialLink {
  id: string
  platform: 'WHATSAPP' | 'TELEGRAM' | 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'WEBSITE' | 'OTHER'
  url: string
  label?: string
  sortOrder: number
}

SupplierSocialLinkCreateRequest {
  platform: 'WHATSAPP' | 'TELEGRAM' | 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'WEBSITE' | 'OTHER'
  url: string
  label?: string
  sortOrder?: number
}

SupplierCatalogProduct {
  id: string
  productId?: string            // null si es descripcion libre
  productName?: string          // resuelto del catalogo interno si productId != null
  description?: string          // null si esta vinculado al catalogo
  unitPrice?: number
  currencyCode?: string
  notes?: string
}

SupplierCatalogProductCreateRequest {
  productId?: string            // obligatorio si description es null
  description?: string          // obligatorio si productId es null
  unitPrice?: number
  currencyCode?: string
  notes?: string
}
// Validacion: productId != null OR description != null

// Upload -- multipart/form-data
SupplierImageUploadRequest {
  file: File                    // max 5 MiB; image/jpeg | image/png | image/webp
  isPrimary?: boolean
  sortOrder?: number
}
```

---

## Sale (extendido)

```typescript
// SaleCreateRequest agrega paymentMode:
SaleCreateRequest {
  idempotencyKey: string
  warehouseId: string
  customerId?: string           // OBLIGATORIO si paymentMode != 'IMMEDIATE'
  paymentMode?: 'IMMEDIATE' | 'CREDIT' | 'RESERVE'  // default: 'IMMEDIATE'
  currencyCode: string
  exchangeRateId?: string
  soldAt?: string
  notes?: string
  lines: SaleLineRequest[]
}

// SaleResponse agrega paymentMode y debtId:
SaleResponse {
  id: string
  warehouseId: string
  customerId?: string
  customerName?: string
  status: 'DRAFT' | 'CONFIRMED' | 'RESERVED' | 'DELIVERED' | 'CANCELLED'
  paymentMode: 'IMMEDIATE' | 'CREDIT' | 'RESERVE'
  debtId?: string               // presente si paymentMode = CREDIT o RESERVE
  soldAt: string
  totals: { revenue: number, cost: number, profit: number }
  currencyCode: string
  notes?: string
  lines: SaleLine[]
  createdBy: string
  createdAt: string
  version: number
}
```

---

## CustomerDebt (nuevo)

```typescript
CustomerDebtResponse {
  id: string
  customerId: string
  customerName: string
  saleId: string
  saleNumber: string
  originalAmount: number
  paidAmount: number
  remainingAmount: number       // computed: originalAmount - paidAmount
  currencyCode: string
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED'
  description?: string          // descripcion de lo adeudado, ej: "4 kg arroz, 2L aceite del 10/4"
  dueDate?: string
  notes?: string
  payments: DebtPaymentResponse[]
  createdAt: string
  updatedAt: string
  version: number
}

DebtPaymentResponse {
  id: string
  debtId: string
  amount: number
  paymentMethod?: 'CASH' | 'TRANSFER' | 'PRODUCT' | 'OTHER'
  notes?: string
  registeredBy: string          // userId
  registeredByName: string      // displayName
  createdAt: string
}

DebtPaymentCreateRequest {
  idempotencyKey: string
  amount: number                // > 0 y <= remainingAmount
  paymentMethod?: 'CASH' | 'TRANSFER' | 'PRODUCT' | 'OTHER'
  notes?: string
}

DebtUpdateRequest {
  description?: string          // actualizar descripcion de lo adeudado
  dueDate?: string
  notes?: string
  status?: 'CANCELLED'          // solo se puede cancelar via PATCH
}
```

---

## Notification (nuevo)

```typescript
NotificationResponse {
  id: string
  type: 'SYSTEM_AUTO' | 'USER_MANUAL'
  category: 'LOW_STOCK' | 'DEBT_OVERDUE' | 'IMPORT_DONE' | 'SYNC_CONFLICT' | 'MANUAL'
  title: string
  body?: string
  targetType: 'USER' | 'ALL'
  createdBy?: string            // userId; null si SYSTEM_AUTO
  createdByName?: string
  entityType?: string
  entityId?: string
  isRead: boolean               // computado desde notification_reads
  readAt?: string
  createdAt: string
}

NotificationCreateRequest {
  title: string
  body?: string
  targetType: 'USER' | 'ALL'
  targetUserId?: string         // obligatorio si targetType = 'USER'
  entityType?: string
  entityId?: string
}

NotificationMarkReadRequest {
  notificationIds: string[]     // max 100 IDs por request
}

UnreadCountResponse {
  count: number
}

// SSE -- event name: "NewNotification", data: NotificationResponse serializado como JSON
```

---

## SyncIncidentReport (nuevo)

```typescript
SyncIncidentReportRequest {
  incidentId: string
  operationId: string
  resolution: 'DISCARD_MINE' | 'REPLACE_SERVER' | 'EDIT_AND_RETRY' | 'FORGET_SALE' | 'CHANGE_PRODUCT'
  editedPayload?: object        // obligatorio si resolution = 'EDIT_AND_RETRY'
}

SyncIncidentResponse {
  id: string
  deviceId: string
  operationId: string
  entityType: string
  entityId: string
  incidentType: string
  errorCode: string
  errorMessage: string
  resolution?: string
  status: 'PENDING' | 'RESOLVED' | 'IGNORED'
  occurredAt: string
  resolvedAt?: string
}
```

---

## DashboardStats (extendido)

```typescript
// DashboardStatsResponse agrega al response existente:
DashboardStatsResponse {
  // ...campos existentes...
  pendingDebtsCount: number
  pendingDebtsTotal: number     // en moneda base del sistema
  partialDebtsCount: number
  pendingSyncIncidentsCount: number
}
```