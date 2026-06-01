package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.AuditLogEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

public interface AuditLogR2dbcRepository extends ReactiveCrudRepository<AuditLogEntity, UUID> {

    @Query("""
        SELECT al.id, al.actor_id, u.display_name AS actor_name,
               al.entity_type, al.entity_id, al.action,
               al.before_data, al.after_data, al.ip_address, al.created_at
        FROM audit_log al
        LEFT JOIN users u ON u.id = al.actor_id
        WHERE (:entityType IS NULL OR al.entity_type = :entityType)
          AND (:actorId IS NULL OR al.actor_id = CAST(:actorId AS uuid))
          AND (:action IS NULL OR al.action = :action)
          AND (:fromDate IS NULL OR al.created_at >= :fromDate)
          AND (:toDate IS NULL OR al.created_at <= :toDate)
          AND (:search IS NULL OR LOWER(u.display_name) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(al.entity_type) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(al.action) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY al.created_at DESC
        LIMIT :size OFFSET :offset
        """)
    Flux<AuditLogEntity> search(
        String entityType, String actorId, String action, String search,
        Instant fromDate, Instant toDate, int size, int offset);

    @Query("""
        SELECT COUNT(*) FROM audit_log al
        LEFT JOIN users u ON u.id = al.actor_id
        WHERE (:entityType IS NULL OR al.entity_type = :entityType)
          AND (:actorId IS NULL OR al.actor_id = CAST(:actorId AS uuid))
          AND (:action IS NULL OR al.action = :action)
          AND (:fromDate IS NULL OR al.created_at >= :fromDate)
          AND (:toDate IS NULL OR al.created_at <= :toDate)
          AND (:search IS NULL OR LOWER(u.display_name) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(al.entity_type) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(al.action) LIKE LOWER(CONCAT('%', :search, '%')))
        """)
    Mono<Long> countSearch(
        String entityType, String actorId, String action, String search,
        Instant fromDate, Instant toDate);

    @Query("""
        SELECT al.id, al.actor_id, u.display_name AS actor_name,
               al.entity_type, al.entity_id, al.action,
               al.before_data, al.after_data, al.ip_address, al.created_at
        FROM audit_log al
        LEFT JOIN users u ON u.id = al.actor_id
        WHERE al.id = :id
        """)
    Mono<AuditLogEntity> findByIdWithActorName(UUID id);

    @Query("""
        SELECT al.id, al.actor_id, u.display_name AS actor_name,
               al.entity_type, al.entity_id, al.action,
               al.before_data, al.after_data, al.ip_address, al.created_at
        FROM audit_log al
        LEFT JOIN users u ON u.id = al.actor_id
        WHERE al.entity_type = :entityType AND al.entity_id = :entityId
        ORDER BY al.created_at DESC
        """)
    Flux<AuditLogEntity> findByEntity(String entityType, UUID entityId);
}
