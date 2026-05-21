package com.inventory.application.usecase.query;

import com.inventory.domain.model.stock.InventoryMovement;
import com.inventory.domain.ports.in.MovementQueryPort;
import com.inventory.domain.ports.out.MovementRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: Consultas de Movimientos de Inventario.
 * Implementa las consultas del ledger de movimientos.
 */
@Service
public class MovementQueryUseCase implements MovementQueryPort {

    private final MovementRepository movementRepository;

    public MovementQueryUseCase(MovementRepository movementRepository) {
        this.movementRepository = movementRepository;
    }

    @Override
    public Mono<InventoryMovement> findById(UUID id) {
        return movementRepository.findById(id);
    }

    @Override
    public Flux<InventoryMovement> findAll(MovementFilter filter) {
        Flux<InventoryMovement> movements = movementRepository.findAllPaginated(filter.page(), filter.size());
        
        if (filter.warehouseId() != null) {
            movements = movements.filter(m -> m.getWarehouseId().equals(filter.warehouseId()));
        }
        if (filter.productId() != null) {
            movements = movements.filter(m -> m.getProductId().equals(filter.productId()));
        }
        if (filter.movementType() != null) {
            movements = movements.filter(m -> m.getMovementType() == filter.movementType());
        }
        if (filter.sourceDocType() != null) {
            movements = movements.filter(m -> m.getSourceDocType().equals(filter.sourceDocType()));
        }
        if (filter.fromDate() != null) {
            movements = movements.filter(m -> !m.getOccurredAt().isBefore(filter.fromDate()));
        }
        if (filter.toDate() != null) {
            movements = movements.filter(m -> !m.getOccurredAt().isAfter(filter.toDate()));
        }
        
        return movements;
    }

    @Override
    public Flux<InventoryMovement> findByWarehouseAndProduct(UUID warehouseId, UUID productId) {
        return movementRepository.findByWarehouseIdAndProductId(warehouseId, productId);
    }

    @Override
    public Flux<InventoryMovement> findBySourceDocument(String sourceDocType, UUID sourceDocId) {
        return movementRepository.findBySourceDocument(sourceDocType, sourceDocId);
    }

    @Override
    public Mono<Long> count(MovementFilter filter) {
        if (filter.movementType() != null) {
            return movementRepository.countByMovementType(filter.movementType());
        }
        return movementRepository.count();
    }
}
