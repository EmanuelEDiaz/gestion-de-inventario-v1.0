package com.inventory.adapters.web.dto.geo;

import java.math.BigDecimal;
import java.util.UUID;

public record GeoRegionResponse(
    UUID id,
    String countryCode,
    String level,
    String name,
    BigDecimal latitude,
    BigDecimal longitude,
    boolean active
) {}
