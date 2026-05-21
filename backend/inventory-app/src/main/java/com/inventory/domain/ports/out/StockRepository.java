package com.inventory.domain.ports.out;

import com.inventory.domain.model.stock.StockBalance;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Puerto de salida: Repositorio de Stock.
 * Define las operaciones de persistencia para balances de inventario.
 */
public interface StockRepository {

    /**
     * Obtiene el balance de un producto en un almacén.
     */
    Mono<StockBalance> findById(UUID warehouseId, UUID productId);

    /**
     * Lista balances de un almacén.
     */
    Flux<StockBalance> findByWarehouseId(UUID warehouseId);

    /**
     * Lista balances de un producto en todos los almacenes.
     */
    Flux<StockBalance> findByProductId(UUID productId);

    /**
     * Lista todos los balances paginados.
     */
    Flux<StockBalance> findAll(int page, int size);

    /**
     * Lista balances bajo el punto de reorden.
     */
    Flux<StockBalance> findBelowReorderPoint();

    /**
     * Lista balances con stock cero o negativo.
     */
    Flux<StockBalance> findOutOfStock();

    /**
     * Guarda o actualiza un balance.
     */
    Mono<StockBalance> save(StockBalance balance);

    /**
     * Actualiza el stock agregando cantidad (para compras, devoluciones).
     */
    Mono<StockBalance> addStock(UUID warehouseId, UUID productId, BigDecimal quantity, BigDecimal unitCost);

    /**
     * Actualiza el stock restando cantidad (para ventas, transferencias out).
     */
    Mono<StockBalance> removeStock(UUID warehouseId, UUID productId, BigDecimal quantity);

    /**
     * Reserva stock para una operación pendiente.
     */
    Mono<StockBalance> reserveStock(UUID warehouseId, UUID productId, BigDecimal quantity);

    /**
     * Libera stock reservado.
     */
    Mono<StockBalance> releaseReservation(UUID warehouseId, UUID productId, BigDecimal quantity);

    /**
     * Verifica si existe suficiente stock disponible.
     */
    Mono<Boolean> hasAvailableStock(UUID warehouseId, UUID productId, BigDecimal quantity);
}
