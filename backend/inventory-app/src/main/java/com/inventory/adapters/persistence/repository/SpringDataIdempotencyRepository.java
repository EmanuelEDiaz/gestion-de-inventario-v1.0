package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.IdempotencyKeyEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.time.Instant;

public interface SpringDataIdempotencyRepository extends ReactiveCrudRepository<IdempotencyKeyEntity, String> {
    Mono<IdempotencyKeyEntity> findByKey(String key);

    @Query("DELETE FROM idempotency_keys WHERE created_at < :before")
    Mono<Void> deleteOlderThan(Instant before);
}
