package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.SyncIncidentEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface R2dbcSyncIncidentRepository extends ReactiveCrudRepository<SyncIncidentEntity, UUID> {

    @Query("SELECT * FROM sync_incidents WHERE status = 'PENDING' ORDER BY created_at ASC")
    Flux<SyncIncidentEntity> findPending();

    @Query("SELECT * FROM sync_incidents WHERE device_id = :deviceId ORDER BY created_at DESC")
    Flux<SyncIncidentEntity> findByDeviceId(String deviceId);

    @Query("SELECT * FROM sync_incidents WHERE user_id = :userId ORDER BY created_at DESC")
    Flux<SyncIncidentEntity> findByUserId(UUID userId);

    @Query("SELECT COUNT(*) > 0 FROM sync_incidents WHERE operation_id = :operationId")
    Mono<Boolean> existsByOperationId(String operationId);
}
