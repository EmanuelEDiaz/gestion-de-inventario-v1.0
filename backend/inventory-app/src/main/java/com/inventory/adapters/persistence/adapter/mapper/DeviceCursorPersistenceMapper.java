package com.inventory.adapters.persistence.adapter.mapper;

import com.inventory.adapters.persistence.entity.DeviceCursorEntity;
import com.inventory.domain.model.sync.DeviceCursor;
import org.springframework.stereotype.Component;

@Component
public class DeviceCursorPersistenceMapper {

    public DeviceCursor toDomain(DeviceCursorEntity entity) {
        if (entity == null) return null;
        return new DeviceCursor(
            entity.getDeviceId(),
            entity.getUserId(),
            entity.getLastCursor(),
            entity.getLastSeenAt(),
            entity.getUserAgent(),
            entity.getCreatedAt()
        );
    }

    public DeviceCursorEntity toEntity(DeviceCursor domain) {
        if (domain == null) return null;
        return new DeviceCursorEntity(
            domain.getDeviceId(),
            domain.getUserId(),
            domain.getLastCursor(),
            domain.getLastSeenAt(),
            domain.getUserAgent(),
            domain.getCreatedAt()
        );
    }
}
