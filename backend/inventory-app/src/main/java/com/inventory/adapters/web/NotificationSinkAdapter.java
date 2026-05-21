package com.inventory.adapters.web;

import com.inventory.domain.model.notification.Notification;
import com.inventory.domain.ports.out.NotificationSinkPort;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;

import java.util.UUID;

/**
 * Adaptador de emisión SSE para notificaciones en tiempo real.
 * Usa Sinks.Many multicast para distribuir notificaciones a todos los suscriptores activos.
 * Los suscriptores filtran por targetType (ALL) o targetUserId.
 */
@Component
public class NotificationSinkAdapter implements NotificationSinkPort {

    private final Sinks.Many<Notification> sink = Sinks.many()
        .multicast()
        .onBackpressureBuffer(256, false);

    @Override
    public Mono<Void> emit(Notification notification) {
        return Mono.fromRunnable(() -> sink.tryEmitNext(notification));
    }

    @Override
    public Flux<Notification> streamForUser(UUID userId) {
        return sink.asFlux()
            .filter(n -> isForUser(n, userId));
    }

    private boolean isForUser(Notification n, UUID userId) {
        return n.targetType() == Notification.TargetType.ALL
            || (n.targetUserId() != null && n.targetUserId().equals(userId));
    }
}
