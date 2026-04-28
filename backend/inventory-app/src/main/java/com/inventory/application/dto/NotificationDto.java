package com.inventory.application.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationDto(
    UUID id,
    String type,
    String category,
    String title,
    String body,
    String targetType,
    UUID targetUserId,
    UUID createdBy,
    String entityType,
    UUID entityId,
    Instant createdAt,
    boolean read
) {}
