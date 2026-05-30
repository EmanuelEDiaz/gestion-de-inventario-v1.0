package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.SyncLogEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;

public interface R2dbcSyncLogRepository extends ReactiveCrudRepository<SyncLogEntity, Long> {

    @Query("SELECT * FROM sync_log WHERE id > :cursor ORDER BY id ASC LIMIT :limit")
    Flux<SyncLogEntity> findAfterCursor(long cursor, int limit);

    @Query("SELECT * FROM sync_log WHERE id > :cursor AND entity_type = :entityType ORDER BY id ASC LIMIT :limit")
    Flux<SyncLogEntity> findAfterCursor(long cursor, int limit, String entityType);

    @Query("SELECT MIN(last_cursor) FROM device_cursors WHERE last_seen_at > NOW() - INTERVAL '7 days'")
    Mono<Long> findMinActiveCursor();

    @Query("DELETE FROM sync_log WHERE id < :cursor AND created_at < :before")
    Mono<Void> deleteOlderThan(long cursor, Instant before);

    @Query("DELETE FROM sync_log WHERE created_at < :before")
    Mono<Void> deleteOlderThanDate(Instant before);
}
