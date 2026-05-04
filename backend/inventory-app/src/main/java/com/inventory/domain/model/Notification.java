package com.inventory.domain.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad de dominio: Notificación interna.
 * Mensajes del sistema o manuales que se muestran en el inbox del usuario.
 */
public record Notification(
    UUID id,
    NotificationType type,
    NotificationCategory category,
    String title,
    String body,
    TargetType targetType,
    UUID targetUserId,
    UUID createdBy,
    String entityType,
    UUID entityId,
    Instant createdAt
) {
    public enum NotificationType {
        SYSTEM_AUTO, USER_MANUAL
    }

    public enum NotificationCategory {
        LOW_STOCK, DEBT_OVERDUE, SYNC_CONFLICT, IMPORT_DONE, MANUAL
    }

    public enum TargetType {
        USER, ALL
    }

    public Notification {
        if (type == null) throw new IllegalArgumentException("type cannot be null");
        if (category == null) throw new IllegalArgumentException("category cannot be null");
        if (title == null || title.isBlank()) throw new IllegalArgumentException("title cannot be blank");
        if (targetType == null) throw new IllegalArgumentException("targetType cannot be null");
        if (targetType == TargetType.USER && targetUserId == null)
            throw new IllegalArgumentException("targetUserId required when targetType is USER");
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public static Notification createSystem(NotificationCategory category, String title, String body,
                                            TargetType targetType, UUID targetUserId,
                                            String entityType, UUID entityId) {
        return new Notification(UUID.randomUUID(), NotificationType.SYSTEM_AUTO, category,
                                title, body, targetType, targetUserId, null,
                                entityType, entityId, Instant.now());
    }

    public static Notification createManual(String title, String body, TargetType targetType,
                                            UUID targetUserId, UUID createdBy) {
        return new Notification(UUID.randomUUID(), NotificationType.USER_MANUAL, NotificationCategory.MANUAL,
                                title, body, targetType, targetUserId, createdBy,
                                null, null, Instant.now());
    }
}
