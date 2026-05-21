package com.inventory.domain.ports.in.notification;

import com.inventory.domain.model.notification.Notification;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada para comandos de notificaciones internas.
 */
public interface NotificationCommandPort {

    Mono<Notification> create(CreateCommand command);

    Mono<Void> dispatchSystem(Notification notification);

    Mono<Void> markRead(UUID notificationId, UUID userId);

    Mono<Void> markAllRead(UUID userId);

    /** Elimina una notificación si pertenece al usuario. */
    Mono<Void> deleteById(UUID notificationId, UUID userId);

    record CreateCommand(
        String title,
        String body,
        Notification.NotificationCategory category,
        Notification.TargetType targetType,
        UUID targetUserId,
        UUID createdBy
    ) {}
}
