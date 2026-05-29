package com.inventory.adapters.web.mapper;

import com.inventory.adapters.web.dto.audit.AuditLogResponse;
import com.inventory.domain.ports.out.AuditLogSearchItem;
import org.springframework.stereotype.Component;

@Component
public class AuditLogWebMapper {

    public AuditLogResponse toResponse(AuditLogSearchItem item) {
        if (item == null) return null;
        return new AuditLogResponse(
            item.id(),
            item.actorId(),
            item.actorName(),
            item.entityType(),
            item.entityId(),
            item.action(),
            item.beforeData(),
            item.afterData(),
            item.ipAddress(),
            item.createdAt()
        );
    }
}
