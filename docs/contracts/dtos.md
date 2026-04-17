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
