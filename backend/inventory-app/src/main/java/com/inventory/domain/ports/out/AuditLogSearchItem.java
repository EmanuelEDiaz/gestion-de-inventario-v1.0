package com.inventory.domain.ports.out;

import java.time.Instant;
import java.util.UUID;

public record AuditLogSearchItem(
    UUID id,
    UUID actorId,
    String actorName,
    String entityType,
    UUID entityId,
    String action,
    String beforeData,
    String afterData,
    String ipAddress,
    Instant createdAt
) {}
