package com.inventory.application.dto.importjob;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record ImportResponse(
    UUID id,
    String type,
    String status,
    String originalFilename,
    Map<String, Object> resultJson,
    String errorMessage,
    UUID createdBy,
    Instant createdAt,
    Instant updatedAt
) {}
