package com.inventory.application.sync.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SyncEntryDto(
    long cursor,
    String entityType,
    UUID entityId,
    String action,
    Object payload,
    UUID warehouseId,
    OffsetDateTime createdAt
) {}
