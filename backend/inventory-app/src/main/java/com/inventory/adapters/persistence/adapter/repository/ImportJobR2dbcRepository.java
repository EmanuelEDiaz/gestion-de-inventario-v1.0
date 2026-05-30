package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.ImportJobEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface ImportJobR2dbcRepository extends ReactiveCrudRepository<ImportJobEntity, UUID> {
    @Query("DELETE FROM import_jobs WHERE status IN ('COMPLETED', 'FAILED') AND created_at < :before")
    Mono<Void> deleteCompletedOlderThan(Instant before);
}
