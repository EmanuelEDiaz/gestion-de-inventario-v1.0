package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.entity.AuditLogEntity;
import com.inventory.adapters.persistence.adapter.mapper.AuditLogPersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.AuditLogR2dbcRepository;
import com.inventory.domain.model.audit.AuditLog;
import com.inventory.domain.ports.out.AuditLogRepository;
import com.inventory.domain.ports.out.AuditLogSearchCriteria;
import com.inventory.domain.ports.out.AuditLogSearchItem;
import org.springframework.r2dbc.core.DatabaseClient;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class AuditLogRepositoryAdapter implements AuditLogRepository {

    private final AuditLogR2dbcRepository r2dbcRepository;
    private final AuditLogPersistenceMapper mapper;
    private final DatabaseClient databaseClient;

    public AuditLogRepositoryAdapter(AuditLogR2dbcRepository r2dbcRepository,
                                      AuditLogPersistenceMapper mapper,
                                      DatabaseClient databaseClient) {
        this.r2dbcRepository = r2dbcRepository;
        this.mapper = mapper;
        this.databaseClient = databaseClient;
    }

    @Override
    public Mono<Void> save(AuditLog log) {
        var spec = databaseClient.sql("""
            INSERT INTO audit_log (id, actor_id, entity_type, entity_id, action, before_data, after_data, ip_address, created_at)
            VALUES (:id, :actorId, :entityType, :entityId, :action, CAST(:beforeData AS jsonb), CAST(:afterData AS jsonb), :ipAddress, :createdAt)
            """)
            .bind("id", log.getId())
            .bind("actorId", log.getActorId())
            .bind("entityType", log.getEntityType())
            .bind("entityId", log.getEntityId())
            .bind("action", log.getAction())
            .bind("ipAddress", log.getIpAddress() != null ? log.getIpAddress() : "")
            .bind("createdAt", log.getCreatedAt());

        if (log.getBeforeData() != null) {
            spec = spec.bind("beforeData", log.getBeforeData());
        } else {
            spec = spec.bindNull("beforeData", String.class);
        }
        if (log.getAfterData() != null) {
            spec = spec.bind("afterData", log.getAfterData());
        } else {
            spec = spec.bindNull("afterData", String.class);
        }

        return spec.then();
    }

    @Override
    public Flux<AuditLogSearchItem> search(AuditLogSearchCriteria criteria) {
        int offset = criteria.size() * criteria.page();
        String searchStr = criteria.search() != null && !criteria.search().isBlank() ? criteria.search() : null;
        return r2dbcRepository.search(
            criteria.entityType(),
            criteria.actorId() != null ? criteria.actorId().toString() : null,
            criteria.action(),
            searchStr,
            criteria.fromDate(),
            criteria.toDate(),
            criteria.size(),
            offset
        ).map(mapper::toSearchItem);
    }

    @Override
    public Mono<Long> countSearch(AuditLogSearchCriteria criteria) {
        String searchStr = criteria.search() != null && !criteria.search().isBlank() ? criteria.search() : null;
        return r2dbcRepository.countSearch(
            criteria.entityType(),
            criteria.actorId() != null ? criteria.actorId().toString() : null,
            criteria.action(),
            searchStr,
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
