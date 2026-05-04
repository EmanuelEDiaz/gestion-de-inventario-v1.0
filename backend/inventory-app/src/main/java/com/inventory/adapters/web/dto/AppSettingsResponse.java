package com.inventory.adapters.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO de respuesta para la configuración global del sistema.
 */
public record AppSettingsResponse(
        String defaultCostMethod,
        String defaultCurrencyCode,
        String companyName,
        BigDecimal lowStockThresholdDefault,
        UUID updatedBy,
        Instant updatedAt,
        int version
) {}
