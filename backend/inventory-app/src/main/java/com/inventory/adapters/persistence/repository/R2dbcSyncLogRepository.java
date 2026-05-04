package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.SyncLogEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface R2dbcSyncLogRepository extends ReactiveCrudRepository<SyncLogEntity, Long> {

    @Query("SELECT * FROM sync_log WHERE id > :cursor ORDER BY id ASC LIMIT :limit")
    Flux<SyncLogEntity> findAfterCursor(long cursor, int limit);
}
