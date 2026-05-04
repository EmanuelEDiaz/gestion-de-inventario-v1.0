# Puertos e Interfaces

## Puertos de Entrada (Use Cases)

### Autenticación
- `LoginUseCase`
- `RefreshTokenUseCase`
- `LogoutUseCase`

### Productos
- `CreateProductUseCase`
- `UpdateProductUseCase`
- `SearchProductsQuery`
- `GetProductQuery`
- `UploadProductImagesUseCase`
- `DeleteProductImageUseCase`

### Ventas
- `CreateSaleUseCase`
- `CancelSaleUseCase`
- `ListSalesQuery`
- `GetSaleQuery`

### Compras
- `CreatePurchaseUseCase`
- `CancelPurchaseUseCase`
- `ListPurchasesQuery`
- `GetPurchaseQuery`

### Transferencias
- `CreateTransferUseCase`
- `CancelTransferUseCase`
- `ListTransfersQuery`
- `GetTransferQuery`

### Ajustes
- `CreateAdjustmentUseCase`
- `ListAdjustmentsQuery`
- `GetAdjustmentQuery`

### Devoluciones
- `CreateReturnUseCase`
- `ListReturnsQuery`
- `GetReturnQuery`

### Proveedores
- `CreateSupplierUseCase`
- `UpdateSupplierUseCase`
- `ListSuppliersQuery`

### Clientes
- `CreateCustomerUseCase`
- `UpdateCustomerUseCase`
- `ListCustomersQuery`

### Categorías
- `CreateCategoryUseCase`
- `UpdateCategoryUseCase`
- `ListCategoriesQuery`

### Almacenes
- `CreateWarehouseUseCase`
- `UpdateWarehouseUseCase`
- `ListWarehousesQuery`

### Stock
- `ListStockQuery`
- `ListMovementsQuery`

### Monedas
- `ListCurrenciesQuery`
- `CreateCurrencyUseCase`
- `UpdateCurrencyUseCase`
- `CreateExchangeRateUseCase`
- `ListExchangeRatesQuery`
- `GetLatestExchangeRateQuery`

### Settings
- `GetSettingsQuery`
- `UpdateSettingsUseCase`

### Dashboard
- `GetDashboardMetricsQuery`

### Import/Export
- `RunCsvImportUseCase`
- `DryRunCsvImportUseCase`
- `GetImportJobStatusQuery`

### Sync
- `SyncPushUseCase`
- `SyncPullQuery`

### Usuarios
- `UploadAvatarUseCase`

## Puertos de Salida (Repository Ports)

```java
// Productos
public interface ProductRepositoryPort {
    Mono<Product> save(Product product);
    Mono<Product> findById(UUID id);
    Mono<Product> findBySku(String sku);
    Flux<Product> search(ProductSearchCriteria criteria);
    Mono<Long> count(ProductSearchCriteria criteria);
}

// Categorías
public interface CategoryRepositoryPort {
    Mono<Category> save(Category category);
    Mono<Category> findById(UUID id);
    Flux<Category> findAll();
    Flux<Category> findChildren(UUID parentId);
}

// Almacenes
public interface WarehouseRepositoryPort {
    Mono<Warehouse> save(Warehouse warehouse);
    Mono<Warehouse> findById(UUID id);
    Mono<Warehouse> findByCode(String code);
    Flux<Warehouse> findAll();
}

// Stock
public interface StockBalanceRepositoryPort {
    Mono<StockBalance> save(StockBalance balance);
    Mono<StockBalance> findByWarehouseAndProduct(UUID warehouseId, UUID productId);
    Flux<StockBalance> findByWarehouse(UUID warehouseId);
    Flux<StockBalance> findBelowReorderPoint();
}

// Movimientos
public interface InventoryMovementRepositoryPort {
    Mono<InventoryMovement> save(InventoryMovement movement);
    Flux<InventoryMovement> findByProduct(UUID productId, Pageable pageable);
    Flux<InventoryMovement> findByWarehouse(UUID warehouseId, Pageable pageable);
    Flux<InventoryMovement> findBySourceDoc(String docType, UUID docId);
}

// Ventas
public interface SaleRepositoryPort {
    Mono<Sale> save(Sale sale);
    Mono<Sale> findById(UUID id);
    Flux<Sale> search(SaleSearchCriteria criteria);
}

// Compras
public interface PurchaseRepositoryPort {
    Mono<Purchase> save(Purchase purchase);
    Mono<Purchase> findById(UUID id);
    Flux<Purchase> search(PurchaseSearchCriteria criteria);
}

// Transferencias
public interface TransferRepositoryPort {
    Mono<Transfer> save(Transfer transfer);
    Mono<Transfer> findById(UUID id);
    Flux<Transfer> search(TransferSearchCriteria criteria);
}

// Ajustes
public interface AdjustmentRepositoryPort {
    Mono<Adjustment> save(Adjustment adjustment);
    Mono<Adjustment> findById(UUID id);
    Flux<Adjustment> search(AdjustmentSearchCriteria criteria);
}

// Devoluciones
public interface ReturnRepositoryPort {
    Mono<Return> save(Return returnDoc);
    Mono<Return> findById(UUID id);
    Flux<Return> search(ReturnSearchCriteria criteria);
}

// Terceros
public interface SupplierRepositoryPort {
    Mono<Supplier> save(Supplier supplier);
    Mono<Supplier> findById(UUID id);
    Flux<Supplier> search(SupplierSearchCriteria criteria);
}

public interface CustomerRepositoryPort {
    Mono<Customer> save(Customer customer);
    Mono<Customer> findById(UUID id);
    Flux<Customer> search(CustomerSearchCriteria criteria);
}

// Monedas
public interface CurrencyRepositoryPort {
    Mono<Currency> save(Currency currency);
    Mono<Currency> findByCode(String code);
    Flux<Currency> findAll();
}

public interface ExchangeRateRepositoryPort {
    Mono<ExchangeRate> save(ExchangeRate rate);
    Mono<ExchangeRate> findLatest(String baseCode, String quoteCode);
    Flux<ExchangeRate> search(ExchangeRateSearchCriteria criteria);
}

// Settings
public interface AppSettingsRepositoryPort {
    Mono<AppSettings> find();
    Mono<AppSettings> save(AppSettings settings);
}

// Auth
public interface RefreshTokenRepositoryPort {
    Mono<RefreshToken> save(RefreshToken token);
    Mono<RefreshToken> findByHash(String hash);
    Mono<Void> revokeByUserId(UUID userId);
    Mono<Void> revokeById(UUID id);
}

// Sistema
public interface AuditLogPort {
    Mono<Void> log(AuditEntry entry);
}

public interface IdempotencyPort {
    Mono<IdempotencyRecord> find(String key);
    Mono<Void> save(String key, String scope, String requestHash, Object response, Duration ttl);
}

public interface SyncLogPort {
    Mono<Void> append(SyncLogEntry entry);
    Flux<SyncLogEntry> pullAfter(Long cursor, UUID warehouseId, int limit);
}

// Archivos
public interface FileStoragePort {
    Mono<Long> store(String relativePath, String contentType, byte[] data);
    Mono<byte[]> read(String relativePath);
    Mono<Void> delete(String relativePath);
}
```

---

## Puertos de Entrada -- nuevos (Backend Java)

### Imagenes de Clientes
- UploadCustomerImageUseCase
- DeleteCustomerImageUseCase
- ListCustomerImagesQuery

### Imagenes de Proveedores
- UploadSupplierImageUseCase
- DeleteSupplierImageUseCase
- ListSupplierImagesQuery

### Proveedor Extendido
- CreateSupplierSocialLinkUseCase
- DeleteSupplierSocialLinkUseCase
- ListSupplierSocialLinksQuery
- CreateSupplierCatalogProductUseCase
- DeleteSupplierCatalogProductUseCase
- ListSupplierCatalogProductsQuery

### Deudas / Fiado
- CreateCreditSaleUseCase *(extiende CreateSaleUseCase -- paymentMode = CREDIT)*
- CreateReserveSaleUseCase *(extiende CreateSaleUseCase -- paymentMode = RESERVE)*
- ConfirmReserveSaleUseCase *(al registrar pago total en venta RESERVE)*
- RegisterDebtPaymentUseCase
- UpdateDebtUseCase
- CancelDebtUseCase
- ListDebtsQuery
- GetDebtQuery
- ListCustomerDebtsQuery

### Notificaciones
- CreateNotificationUseCase
- DispatchSystemNotificationUseCase *(llamado internamente por el dominio)*
- MarkNotificationsReadUseCase
- MarkAllNotificationsReadUseCase
- ListNotificationsQuery
- GetUnreadCountQuery

### Sync -- Incidencias
- ReportSyncIncidentUseCase
- ListSyncIncidentsQuery

---

## Puertos de Salida -- nuevos (Backend Java)

```java
// Imagenes de clientes
public interface CustomerImageRepositoryPort {
    Mono<CustomerImage> save(CustomerImage image);
    Mono<CustomerImage> findById(UUID id);
    Flux<CustomerImage> findByCustomerId(UUID customerId);
    Mono<Boolean> existsPrimaryForCustomer(UUID customerId);
    Mono<Void> clearPrimaryForCustomer(UUID customerId);
    Mono<Void> deleteById(UUID id);
}

// Imagenes de proveedores
public interface SupplierImageRepositoryPort {
    Mono<SupplierImage> save(SupplierImage image);
    Mono<SupplierImage> findById(UUID id);
    Flux<SupplierImage> findBySupplierId(UUID supplierId);
    Mono<Boolean> existsPrimaryForSupplier(UUID supplierId);
    Mono<Void> clearPrimaryForSupplier(UUID supplierId);
    Mono<Void> deleteById(UUID id);
}

// Links sociales de proveedor
public interface SupplierSocialLinkRepositoryPort {
    Mono<SupplierSocialLink> save(SupplierSocialLink link);
    Mono<SupplierSocialLink> findById(UUID id);
    Flux<SupplierSocialLink> findBySupplierId(UUID supplierId);
    Mono<Void> deleteById(UUID id);
}

// Catalogo de productos del proveedor
public interface SupplierCatalogProductRepositoryPort {
    Mono<SupplierCatalogProduct> save(SupplierCatalogProduct entry);
    Mono<SupplierCatalogProduct> findById(UUID id);
    Flux<SupplierCatalogProduct> findBySupplierId(UUID supplierId);
    Mono<Void> deleteById(UUID id);
}

// Deudas
public interface CustomerDebtRepositoryPort {
    Mono<CustomerDebt> save(CustomerDebt debt);
    Mono<CustomerDebt> findById(UUID id);
    Mono<CustomerDebt> findBySaleId(UUID saleId);
    Flux<CustomerDebt> findByCustomerId(UUID customerId);
    Flux<CustomerDebt> search(DebtSearchCriteria criteria);
    Mono<Long> countByStatus(String status);
    Mono<BigDecimal> sumRemainingByStatus(String status, String currencyCode);
}

// Pagos de deudas
public interface DebtPaymentRepositoryPort {
    Mono<DebtPayment> save(DebtPayment payment);
    Flux<DebtPayment> findByDebtId(UUID debtId);
}

// Notificaciones
public interface NotificationRepositoryPort {
    Mono<Notification> save(Notification notification);
    Mono<Notification> findById(UUID id);
    Flux<Notification> findForUser(UUID userId, NotificationSearchCriteria criteria);
    Mono<Long> countUnreadForUser(UUID userId);
}

// Lecturas de notificaciones
public interface NotificationReadRepositoryPort {
    Mono<Void> markRead(UUID notificationId, UUID userId, Instant readAt);
    Mono<Void> markAllRead(UUID userId, Instant readAt);
    Mono<Boolean> isRead(UUID notificationId, UUID userId);
}

// Sink reactivo para SSE (notificaciones en tiempo real)
public interface NotificationSinkPort {
    Mono<Void> emit(Notification notification);
    Flux<Notification> streamForUser(UUID userId);
}

// Incidencias de sync
public interface SyncIncidentRepositoryPort {
    Mono<SyncIncident> save(SyncIncident incident);
    Mono<SyncIncident> findById(UUID id);
    Flux<SyncIncident> search(IncidentSearchCriteria criteria);
    Mono<Long> countPending();
}
```

---

## Criterios de Busqueda -- nuevos (Backend Java)

```java
public class DebtSearchCriteria {
    UUID customerId;        // opcional
    String status;          // PENDING | PARTIAL | PAID | CANCELLED
    Instant dueBefore;      // deudas cuyo due_date < dueBefore
    int page;
    int size;
}

public class NotificationSearchCriteria {
    boolean unreadOnly;
    String category;        // opcional
    int page;
    int size;
}

public class IncidentSearchCriteria {
    String entityType;      // opcional
    String incidentType;    // opcional
    String status;          // PENDING | RESOLVED | IGNORED
    int page;
    int size;
}
```

---

## Puertos Frontend (TypeScript -- core/interfaces/)

```typescript
// Busqueda universal paginada
export interface ISearchableRepository<T, F> {
  search(filters: F, page: number, size: number): Promise<PagedResult<T>>
}

export interface PagedResult<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// Incidencias (IndexedDB)
export interface ISyncIncidentRepository {
  save(incident: SyncIncident): Promise<SyncIncident>
  findById(incidentId: string): Promise<SyncIncident | null>
  findAll(filters: IncidentFilters): Promise<PagedResult<SyncIncident>>
  countPending(): Promise<number>
  markResolved(incidentId: string, resolution: ResolutionAction): Promise<void>
  markIgnored(incidentId: string): Promise<void>
}

// Cola de uploads (IndexedDB)
export interface IUploadQueueRepository {
  enqueue(entry: UploadQueueEntry): Promise<UploadQueueEntry>
  findPending(): Promise<UploadQueueEntry[]>
  updateStatus(fileId: string, status: UploadStatus, error?: string): Promise<void>
  deleteByFileId(fileId: string): Promise<void>
}

// Configuracion de pantalla (localStorage)
export interface IDisplaySettingsRepository {
  get(): DisplaySettings               // sincrono
  save(settings: DisplaySettings): void // sincrono
}
```

---

## Filtros Frontend por entidad (TypeScript -- core/interfaces/filters.ts)

```typescript
export interface ProductFilters {
  search?: string
  categoryId?: string
  status?: 'ACTIVE' | 'ARCHIVED'
  minPrice?: number
  maxPrice?: number
  lowStock?: boolean
  page: number
  size: number
}

export interface CustomerFilters {
  search?: string
  isActive?: boolean
  hasPendingDebt?: boolean
  page: number
  size: number
}

export interface SupplierFilters {
  search?: string
  isActive?: boolean
  platform?: string
  hasProducts?: boolean
  page: number
  size: number
}

export interface SaleFilters {
  search?: string
  warehouseId?: string
  customerId?: string
  status?: SaleStatus
  paymentMode?: PaymentMode
  fromDate?: string
  toDate?: string
  page: number
  size: number
}

export interface DebtFilters {
  customerId?: string
  status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED'
  dueBefore?: string
  page: number
  size: number
}

export interface NotificationFilters {
  unreadOnly?: boolean
  category?: string
  page: number
  size: number
}

export interface IncidentFilters {
  status?: 'PENDING' | 'RESOLVED' | 'IGNORED'
  entityType?: string
  incidentType?: string
  page: number
  size: number
}

export interface MovementFilters {
  warehouseId?: string
  productId?: string
  movementType?: string
  fromDate?: string
  toDate?: string
  page: number
  size: number
}
```