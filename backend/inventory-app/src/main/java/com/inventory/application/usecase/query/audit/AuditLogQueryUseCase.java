package com.inventory.application.usecase.query.audit;

import com.inventory.domain.ports.out.AuditLogRepository;
import com.inventory.domain.ports.out.AuditLogSearchCriteria;
import com.inventory.domain.ports.out.AuditLogSearchItem;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
public class AuditLogQueryUseCase {

    private final AuditLogRepository auditLogRepository;

    public AuditLogQueryUseCase(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public Flux<AuditLogSearchItem> search(AuditLogSearchCriteria criteria) {
        return auditLogRepository.search(criteria);
    }

    public Mono<Long> countSearch(AuditLogSearchCriteria criteria) {
        return auditLogRepository.countSearch(criteria);
    }

    public Mono<AuditLogSearchItem> findById(UUID id) {
        return auditLogRepository.findById(id);
    }

    public Flux<AuditLogSearchItem> findByEntity(String entityType, UUID entityId) {
        return auditLogRepository.findByEntity(entityType, entityId);
    }
}
