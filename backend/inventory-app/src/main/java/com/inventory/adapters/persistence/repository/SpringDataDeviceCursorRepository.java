package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.DeviceCursorEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

public interface SpringDataDeviceCursorRepository extends ReactiveCrudRepository<DeviceCursorEntity, UUID> {
    // Find by user_id
    Flux<DeviceCursorEntity> findByUserId(UUID userId);
    
    // Find minimum last_cursor for active devices (used for cleanup)
    @Query("""
        SELECT MIN(last_cursor) as min_cursor
        FROM device_cursors
        WHERE last_seen_at > :threshold
        """)
    Mono<Long> findMinActiveCursor(Instant threshold);
}
