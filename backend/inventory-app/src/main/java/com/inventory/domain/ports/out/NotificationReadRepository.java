package com.inventory.domain.ports.out;

import com.inventory.domain.model.notification.NotificationRead;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de salida: registro de lecturas de notificaciones.
 * Evita borrar notificaciones; solo marca como leída por usuario.
 */
public interface NotificationReadRepository {

    Mono<Boolean> hasRead(UUID notificationId, UUID userId);

    Mono<NotificationRead> save(NotificationRead read);

    Flux<UUID> findReadNotificationIdsByUserId(UUID userId);

    Mono<Long> countUnreadByUserId(UUID userId);

    Mono<Void> deleteByNotificationId(UUID notificationId);
}
