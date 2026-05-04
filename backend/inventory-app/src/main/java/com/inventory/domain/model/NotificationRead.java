package com.inventory.domain.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad de dominio: registro de lectura de notificación.
 * Evita borrar notificaciones — solo marca como leída por un usuario específico.
 * Clave primaria compuesta: (notificationId, userId).
 */
public record NotificationRead(
    UUID notificationId,
    UUID userId,
    Instant readAt
) {
    public NotificationRead {
        if (notificationId == null) throw new IllegalArgumentException("notificationId cannot be null");
        if (userId == null) throw new IllegalArgumentException("userId cannot be null");
        if (readAt == null) readAt = Instant.now();
    }

    public static NotificationRead of(UUID notificationId, UUID userId) {
        return new NotificationRead(notificationId, userId, Instant.now());
    }
}
