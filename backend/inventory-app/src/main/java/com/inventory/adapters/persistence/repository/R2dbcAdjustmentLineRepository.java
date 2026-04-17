package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.AdjustmentLineEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Repositorio R2DBC para líneas de ajuste.
 */
public interface R2dbcAdjustmentLineRepository extends ReactiveCrudRepository<AdjustmentLineEntity, UUID> {

    Flux<AdjustmentLineEntity> findByAdjustmentIdOrderBySortOrder(UUID adjustmentId);
    Mono<Void> deleteByAdjustmentId(UUID adjustmentId);
}
