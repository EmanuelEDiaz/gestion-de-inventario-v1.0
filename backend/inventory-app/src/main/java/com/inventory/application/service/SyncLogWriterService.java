package com.inventory.application.service;

import com.inventory.adapters.persistence.adapter.SyncLogWriterAdapter;
import com.inventory.domain.ports.out.SyncLogWriterPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
public class SyncLogWriterService implements SyncLogWriterPort {

    private final SyncLogWriterAdapter syncLogWriterAdapter;

    public SyncLogWriterService(SyncLogWriterAdapter syncLogWriterAdapter) {
        this.syncLogWriterAdapter = syncLogWriterAdapter;
    }

    @Override
    public Mono<Void> log(String entityType, UUID entityId, String action, Object payload, UUID warehouseId) {
        return syncLogWriterAdapter.log(entityType, entityId, action, payload, warehouseId);
    }
}
