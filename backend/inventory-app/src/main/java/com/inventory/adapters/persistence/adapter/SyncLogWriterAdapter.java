package com.inventory.adapters.persistence.adapter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.adapters.persistence.adapter.entity.SyncLogEntity;
import com.inventory.adapters.persistence.adapter.repository.R2dbcSyncLogRepository;
import com.inventory.domain.ports.out.SyncLogWriterPort;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.OffsetDateTime;
import java.util.UUID;

@Component
public class SyncLogWriterAdapter implements SyncLogWriterPort {

    private final R2dbcSyncLogRepository syncLogRepo;
    private final ObjectMapper objectMapper;

    public SyncLogWriterAdapter(R2dbcSyncLogRepository syncLogRepo, ObjectMapper objectMapper) {
        this.syncLogRepo = syncLogRepo;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> log(String entityType, UUID entityId, String action, Object payload, UUID warehouseId) {
        var entity = new SyncLogEntity();
        entity.setEntityType(entityType);
        entity.setEntityId(entityId);
        entity.setAction(action);
        entity.setPayload(toJson(payload));
        entity.setWarehouseId(warehouseId);
        entity.setCreatedAt(OffsetDateTime.now());
        return syncLogRepo.save(entity).then();
    }

    private String toJson(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }
}
