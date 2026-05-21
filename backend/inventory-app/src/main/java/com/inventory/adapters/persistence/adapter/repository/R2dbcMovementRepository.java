package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.InventoryMovementEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface R2dbcMovementRepository extends ReactiveCrudRepository<InventoryMovementEntity, UUID> {

    Flux<InventoryMovementEntity> findByWarehouseId(UUID warehouseId);

    Flux<InventoryMovementEntity> findByProductId(UUID productId);

    Flux<InventoryMovementEntity> findByWarehouseIdAndProductId(UUID warehouseId, UUID productId);

    Flux<InventoryMovementEntity> findByMovementType(String movementType);

    @Query("SELECT * FROM inventory_movements WHERE source_doc_type = :sourceDocType AND source_doc_id = :sourceDocId ORDER BY occurred_at")
    Flux<InventoryMovementEntity> findBySourceDocument(String sourceDocType, UUID sourceDocId);

    @Query("SELECT * FROM inventory_movements WHERE occurred_at >= :from AND occurred_at <= :to ORDER BY occurred_at DESC")
    Flux<InventoryMovementEntity> findByDateRange(Instant from, Instant to);

    @Query("SELECT * FROM inventory_movements ORDER BY occurred_at DESC LIMIT :size OFFSET :offset")
    Flux<InventoryMovementEntity> findAllPaginated(int size, int offset);

    Mono<Long> countByMovementType(String movementType);
}
