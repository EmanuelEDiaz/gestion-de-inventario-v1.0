package com.inventory.domain.ports.in.stock;

import com.inventory.domain.model.stock.StockBalance;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada: Consultas de Stock.
 * Define las operaciones de lectura para balances de inventario.
 */
public interface StockQueryPort {

    /**
     * Obtiene el balance de un producto en un almacén.
     */
    Mono<StockBalance> getBalance(UUID warehouseId, UUID productId);

    /**
     * Lista balances de un almacén con filtros opcionales.
     */
    Flux<StockBalance> getBalancesByWarehouse(UUID warehouseId, boolean belowReorderOnly);

    /**
     * Lista balances de un producto en todos los almacenes.
     */
    Flux<StockBalance> getBalancesByProduct(UUID productId);

    /**
     * Lista todos los balances con filtros.
     */
    Flux<StockBalance> getAllBalances(StockFilter filter);

    /**
     * Obtiene productos con stock bajo el punto de reorden.
     */
    Flux<StockBalance> getLowStockAlerts();

    record StockFilter(
        UUID warehouseId,
        UUID productId,
        UUID categoryId,
        Boolean belowReorderPoint,
        Boolean outOfStock,
        int page,
        int size
    ) {
        public static StockFilter all(int page, int size) {
            return new StockFilter(null, null, null, null, null, page, size);
        }
    }
}
