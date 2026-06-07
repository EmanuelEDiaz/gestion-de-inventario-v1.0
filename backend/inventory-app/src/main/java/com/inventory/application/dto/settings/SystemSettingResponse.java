package com.inventory.application.dto.settings;

import java.time.Instant;

public record SystemSettingResponse(
    String key,
    String value,
    String valueType,
    String description,
    boolean isPublic,
    Instant updatedAt
) {}
