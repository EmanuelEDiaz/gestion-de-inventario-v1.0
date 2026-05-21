package com.inventory.domain.ports.in;

import com.inventory.domain.model.stock.InventoryMovement;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

/**
 * Puerto de entrada: Consultas de Movimientos de Inventario.
 * Define las operaciones de lectura para el ledger de movimientos.
 */
public interface MovementQueryPort {

    /**
     * Obtiene un movimiento por ID.
     */
    Mono<InventoryMovement> findById(UUID id);

    /**
     * Lista movimientos con filtros.
     */
    Flux<InventoryMovement> findAll(MovementFilter filter);

    /**
     * Lista movimientos de un producto en un almacén.
     */
    Flux<InventoryMovement> findByWarehouseAndProduct(UUID warehouseId, UUID productId);

    /**
     * Lista movimientos de un documento fuente.
     */
    Flux<InventoryMovement> findBySourceDocument(String sourceDocType, UUID sourceDocId);

    /**
     * Cuenta movimientos con filtros.
     */
    Mono<Long> count(MovementFilter filter);

    record MovementFilter(
        UUID warehouseId,
        UUID productId,
        InventoryMovement.MovementType movementType,
        String sourceDocType,
        Instant fromDate,
        Instant toDate,
        int page,
        int size
    ) {
        public static MovementFilter recent(int page, int size) {
            return new MovementFilter(null, null, null, null, null, null, page, size);
        }
    }
}
