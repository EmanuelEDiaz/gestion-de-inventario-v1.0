package com.inventory.adapters.web.mapper;

import com.inventory.adapters.web.dto.settings.AppSettingsResponse;
import com.inventory.domain.model.settings.AppSettings;
import org.springframework.stereotype.Component;

/**
 * Mapper entre AppSettings (dominio) y AppSettingsResponse (DTO web).
 */
@Component
public class AppSettingsWebMapper {

    public AppSettingsResponse toResponse(AppSettings domain) {
        if (domain == null) return null;
        return new AppSettingsResponse(
                domain.getDefaultCostMethod().name(),
                domain.getDefaultCurrencyCode(),
                domain.getCompanyName(),
                domain.getLowStockThresholdDefault(),
                domain.getUpdatedBy(),
                domain.getUpdatedAt(),
                domain.getVersion()
        );
    }
}
