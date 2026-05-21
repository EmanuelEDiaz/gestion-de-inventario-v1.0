package com.inventory.domain.ports.out;

import com.inventory.domain.model.stock.InventoryMovement;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

/**
 * Puerto de salida: Repositorio de Movimientos de Inventario.
 * Define las operaciones de persistencia para el ledger de movimientos.
 */
public interface MovementRepository {

    /**
     * Obtiene un movimiento por ID.
     */
    Mono<InventoryMovement> findById(UUID id);

    /**
     * Lista movimientos de un almacén.
     */
    Flux<InventoryMovement> findByWarehouseId(UUID warehouseId);

    /**
     * Lista movimientos de un producto.
     */
    Flux<InventoryMovement> findByProductId(UUID productId);

    /**
     * Lista movimientos de un producto en un almacén.
     */
    Flux<InventoryMovement> findByWarehouseIdAndProductId(UUID warehouseId, UUID productId);

    /**
     * Lista movimientos por tipo.
     */
    Flux<InventoryMovement> findByMovementType(InventoryMovement.MovementType movementType);

    /**
     * Lista movimientos de un documento fuente.
     */
    Flux<InventoryMovement> findBySourceDocument(String sourceDocType, UUID sourceDocId);

    /**
     * Lista movimientos en un rango de fechas.
     */
    Flux<InventoryMovement> findByDateRange(Instant from, Instant to);

    /**
     * Lista movimientos paginados.
     */
    Flux<InventoryMovement> findAllPaginated(int page, int size);

    /**
     * Guarda un movimiento (inmutable - solo inserción).
     */
    Mono<InventoryMovement> save(InventoryMovement movement);

    /**
     * Cuenta movimientos con filtros.
     */
    Mono<Long> count();

    /**
     * Cuenta movimientos de un tipo.
     */
    Mono<Long> countByMovementType(InventoryMovement.MovementType movementType);
}
