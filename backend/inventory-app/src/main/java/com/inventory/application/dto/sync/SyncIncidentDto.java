package com.inventory.application.sync.dto;

import java.time.Instant;
import java.util.UUID;

public record SyncIncidentDto(
    UUID id,
    String deviceId,
    String operationId,
    String entityType,
    String entityId,
    String incidentType,
    String status,
    String myPayload,
    String serverPayload,
    String resolution,
    UUID userId,
    Instant createdAt,
    Instant resolvedAt
) {}
