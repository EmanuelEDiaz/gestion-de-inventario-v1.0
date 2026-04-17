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
