package com.inventory.domain.ports.out;

import com.inventory.domain.model.Notification;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de salida: canal de emisión de notificaciones en tiempo real (SSE).
 * El adaptador implementa este puerto con un reactor Sinks.Many.
 */
public interface NotificationSinkPort {

    /**
     * Emite una notificación a todos los suscriptores activos.
     * Los suscriptores filtran por targetType y targetUserId.
     */
    Mono<Void> emit(Notification notification);

    /**
     * Stream de notificaciones destinadas a un usuario específico
     * (incluye las de tipo ALL y las dirigidas a ese userId).
     */
    Flux<Notification> streamForUser(UUID userId);
}
