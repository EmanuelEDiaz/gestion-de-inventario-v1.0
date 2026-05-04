package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.TransferLineEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * R2DBC Repository para TransferLineEntity.
 */
@Repository
public interface R2dbcTransferLineRepository extends ReactiveCrudRepository<TransferLineEntity, UUID> {

    Flux<TransferLineEntity> findByTransferIdOrderBySortOrder(UUID transferId);
    
    Mono<Void> deleteByTransferId(UUID transferId);
}
