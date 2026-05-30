package com.inventory.application.dto.sync;

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
