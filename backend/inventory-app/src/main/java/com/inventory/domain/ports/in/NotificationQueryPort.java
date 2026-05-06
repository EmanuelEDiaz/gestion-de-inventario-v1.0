package com.inventory.domain.ports.in;

import com.inventory.domain.model.Notification;
import org.springframework.data.domain.Pageable;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada para consultas de notificaciones internas.
 */
public interface NotificationQueryPort {

    Flux<Notification> listForUser(UUID userId, boolean includeRead);

    Mono<Long> getUnreadCount(UUID userId);

    /**
     * Obtiene notificaciones del sistema (source=SYSTEM) paginadas.
     */
    Flux<Notification> listSystemNotifications(UUID userId, Pageable pageable);

    /**
     * Obtiene notificaciones de usuarios (source=USER) paginadas.
     */
    Flux<Notification> listUserNotifications(UUID userId, Pageable pageable);
}
