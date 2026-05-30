package com.inventory.domain.ports.out;

import com.inventory.adapters.persistence.entity.DeviceCursorEntity;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface DeviceCursorRepository {
    Mono<DeviceCursorEntity> findByDeviceId(UUID deviceId);
    Mono<Void> save(DeviceCursorEntity entity);
    Mono<Void> updateCursor(UUID deviceId, long cursor);
}
