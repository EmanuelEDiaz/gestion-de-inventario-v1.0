package com.inventory.adapters.web.dto.audit;

import com.inventory.adapters.web.dto.ProblemDetail;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
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
