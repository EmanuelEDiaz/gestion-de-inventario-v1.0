package com.inventory.domain.ports.out;

import reactor.core.publisher.Mono;

import java.util.UUID;

public interface SyncLogWriterPort {
    Mono<Void> log(String entityType, UUID entityId, String action, Object payload, UUID warehouseId);
}
