package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.TransferEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

/**
 * R2DBC Repository para TransferEntity.
 */
@Repository
public interface R2dbcTransferRepository extends ReactiveCrudRepository<TransferEntity, UUID> {

    Flux<TransferEntity> findByFromWarehouseId(UUID fromWarehouseId);
    
    Flux<TransferEntity> findByToWarehouseId(UUID toWarehouseId);
    
    Flux<TransferEntity> findByStatus(String status);
    
    Flux<TransferEntity> findByTransferDateBetween(LocalDate from, LocalDate to);
    
    Mono<Boolean> existsByTransferNumber(String transferNumber);
    
    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(transfer_number FROM 4) AS INTEGER)), 0) + 1 FROM transfers WHERE transfer_number LIKE 'TR-%'")
    Mono<Long> getNextSequence();
}
