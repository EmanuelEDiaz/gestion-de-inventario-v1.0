package com.inventory.domain.ports.in;

import com.inventory.domain.model.Notification;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada para consultas de notificaciones internas.
 */
public interface NotificationQueryPort {

    Flux<Notification> listForUser(UUID userId, boolean includeRead);

    Mono<Long> getUnreadCount(UUID userId);
}
