package com.inventory.adapters.persistence.mapper;

import com.inventory.adapters.persistence.entity.AppSettingsEntity;
import com.inventory.domain.model.settings.AppSettings;
import com.inventory.domain.model.settings.AppSettings.CostMethod;
import org.springframework.stereotype.Component;

import java.time.Instant;

/**
 * Mapper entre AppSettings (dominio) y AppSettingsEntity (R2DBC).
 */
@Component
public class AppSettingsPersistenceMapper {

    public AppSettings toDomain(AppSettingsEntity entity) {
        if (entity == null) return null;
        return new AppSettings(
                entity.getId(),
                entity.getDefaultCostMethod() != null
                        ? CostMethod.valueOf(entity.getDefaultCostMethod())
                        : CostMethod.STANDARD,
                entity.getDefaultCurrencyCode(),
                entity.getCompanyName(),
                entity.getLowStockThresholdDefault(),
                entity.getUpdatedBy(),
                entity.getUpdatedAt(),
                entity.getVersion() != null ? entity.getVersion() : 0
        );
    }

    public AppSettingsEntity toEntity(AppSettings domain) {
        if (domain == null) return null;
        AppSettingsEntity entity = new AppSettingsEntity();
        entity.setId(domain.getId());
        entity.setDefaultCostMethod(domain.getDefaultCostMethod().name());
        entity.setDefaultCurrencyCode(domain.getDefaultCurrencyCode());
        entity.setCompanyName(domain.getCompanyName());
        entity.setLowStockThresholdDefault(domain.getLowStockThresholdDefault());
        entity.setUpdatedBy(domain.getUpdatedBy());
        entity.setUpdatedAt(domain.getUpdatedAt() != null ? domain.getUpdatedAt() : Instant.now());
        entity.setVersion(domain.getVersion());
        return entity;
    }
}
