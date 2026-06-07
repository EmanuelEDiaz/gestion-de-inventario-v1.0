package com.inventory.adapters.persistence.adapter.mapper;

import com.inventory.adapters.persistence.adapter.entity.SystemSettingEntity;
import com.inventory.application.dto.settings.SystemSettingResponse;
import org.springframework.stereotype.Component;

@Component
public class SystemSettingsPersistenceMapper {

    public SystemSettingResponse toResponse(SystemSettingEntity entity) {
        if (entity == null) return null;
        return new SystemSettingResponse(
            entity.getKey(),
            entity.getValue(),
            entity.getValueType(),
            entity.getDescription(),
            entity.isPublic(),
            entity.getUpdatedAt()
        );
    }
}
