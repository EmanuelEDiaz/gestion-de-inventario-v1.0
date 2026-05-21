package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.AdjustmentEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Repositorio R2DBC para ajustes.
 */
public interface R2dbcAdjustmentRepository extends ReactiveCrudRepository<AdjustmentEntity, UUID> {

    Flux<AdjustmentEntity> findByWarehouseId(UUID warehouseId);
    Flux<AdjustmentEntity> findByStatus(String status);
    Flux<AdjustmentEntity> findByType(String type);
    Flux<AdjustmentEntity> findByAdjustmentDateBetween(LocalDate from, LocalDate to);

    @Query("SELECT nextval('adjustment_number_seq')")
    Mono<Long> getNextNumber();
}
