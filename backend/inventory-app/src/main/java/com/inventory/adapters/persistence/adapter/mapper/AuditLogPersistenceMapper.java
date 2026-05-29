package com.inventory.adapters.persistence.adapter.mapper;

import com.inventory.adapters.persistence.adapter.entity.AuditLogEntity;
import com.inventory.domain.model.audit.AuditLog;
import com.inventory.domain.ports.out.AuditLogSearchItem;
import org.springframework.stereotype.Component;

@Component
public class AuditLogPersistenceMapper {

    public AuditLog toDomain(AuditLogEntity entity) {
        if (entity == null) return null;
        return new AuditLog(
            entity.getId(),
            entity.getActorId(),
            entity.getEntityType(),
            entity.getEntityId(),
            entity.getAction(),
            entity.getBeforeData(),
            entity.getAfterData(),
            entity.getIpAddress(),
            entity.getCreatedAt()
        );
    }

    public AuditLogEntity toEntity(AuditLog domain) {
        if (domain == null) return null;
        AuditLogEntity entity = new AuditLogEntity();
        entity.setId(domain.getId());
        entity.setActorId(domain.getActorId());
        entity.setActorName(null);
        entity.setEntityType(domain.getEntityType());
        entity.setEntityId(domain.getEntityId());
        entity.setAction(domain.getAction());
        entity.setBeforeData(domain.getBeforeData());
        entity.setAfterData(domain.getAfterData());
        entity.setIpAddress(domain.getIpAddress());
        entity.setCreatedAt(domain.getCreatedAt());
        return entity;
    }

    public AuditLogSearchItem toSearchItem(AuditLogEntity entity) {
        if (entity == null) return null;
        return new AuditLogSearchItem(
            entity.getId(),
            entity.getActorId(),
            entity.getActorName(),
            entity.getEntityType(),
            entity.getEntityId(),
            entity.getAction(),
            entity.getBeforeData(),
            entity.getAfterData(),
            entity.getIpAddress(),
            entity.getCreatedAt()
        );
    }
}
