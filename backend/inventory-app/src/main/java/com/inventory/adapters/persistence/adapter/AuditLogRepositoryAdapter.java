package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.entity.AuditLogEntity;
import com.inventory.adapters.persistence.adapter.mapper.AuditLogPersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.AuditLogR2dbcRepository;
import com.inventory.domain.model.audit.AuditLog;
import com.inventory.domain.ports.out.AuditLogRepository;
import com.inventory.domain.ports.out.AuditLogSearchCriteria;
import com.inventory.domain.ports.out.AuditLogSearchItem;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class AuditLogRepositoryAdapter implements AuditLogRepository {

    private final AuditLogR2dbcRepository r2dbcRepository;
    private final AuditLogPersistenceMapper mapper;

    public AuditLogRepositoryAdapter(AuditLogR2dbcRepository r2dbcRepository,
                                      AuditLogPersistenceMapper mapper) {
        this.r2dbcRepository = r2dbcRepository;
        this.mapper = mapper;
    }

    @Override
    public Mono<Void> save(AuditLog log) {
        AuditLogEntity entity = mapper.toEntity(log);
        return r2dbcRepository.save(entity).then();
    }

    @Override
    public Flux<AuditLogSearchItem> search(AuditLogSearchCriteria criteria) {
        int offset = criteria.size() * criteria.page();
        return r2dbcRepository.search(
            criteria.entityType(),
            criteria.actorId() != null ? criteria.actorId().toString() : null,
            criteria.action(),
            criteria.fromDate(),
            criteria.toDate(),
            criteria.size(),
            offset
        ).map(mapper::toSearchItem);
    }

    @Override
    public Mono<Long> countSearch(AuditLogSearchCriteria criteria) {
        return r2dbcRepository.countSearch(
            criteria.entityType(),
            criteria.actorId() != null ? criteria.actorId().toString() : null,
            criteria.action(),
            criteria.fromDate(),
            criteria.toDate()
        );
    }

    @Override
    public Mono<AuditLogSearchItem> findById(UUID id) {
        return r2dbcRepository.findByIdWithActorName(id)
            .map(mapper::toSearchItem);
    }

    @Override
    public Flux<AuditLogSearchItem> findByEntity(String entityType, UUID entityId) {
        return r2dbcRepository.findByEntity(entityType, entityId)
            .map(mapper::toSearchItem);
    }
}
