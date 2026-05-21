package com.inventory.domain.ports.out;

import com.inventory.domain.model.notification.Notification;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de salida: Repositorio de notificaciones.
 */
public interface NotificationRepository {

    Mono<Notification> findById(UUID id);

    Flux<Notification> findByUserId(UUID userId);

    Flux<Notification> findUnreadByUserId(UUID userId);

    Flux<Notification> findBroadcast();

    Mono<Notification> save(Notification notification);

    Mono<Void> deleteById(UUID id);

    Mono<Void> deleteOlderThan(java.time.Instant threshold);
}
