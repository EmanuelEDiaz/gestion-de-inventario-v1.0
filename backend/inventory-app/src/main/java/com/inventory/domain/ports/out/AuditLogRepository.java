package com.inventory.domain.ports.out;

import com.inventory.domain.model.audit.AuditLog;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface AuditLogRepository {
    Mono<Void> save(AuditLog log);

    Flux<AuditLogSearchItem> search(AuditLogSearchCriteria criteria);
    Mono<Long> countSearch(AuditLogSearchCriteria criteria);
    Mono<AuditLogSearchItem> findById(UUID id);

    Flux<AuditLogSearchItem> findByEntity(String entityType, UUID entityId);
}
