package com.inventory.domain.ports.out;

import com.inventory.domain.model.sync.DeviceCursor;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface DeviceCursorRepository {
    Mono<DeviceCursor> findByDeviceId(UUID deviceId);
    Mono<Void> save(DeviceCursor cursor);
    Mono<Void> updateCursor(UUID deviceId, long cursor);
}
