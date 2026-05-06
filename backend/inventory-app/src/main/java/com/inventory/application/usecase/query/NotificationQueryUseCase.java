package com.inventory.application.usecase.query;

import com.inventory.domain.model.Notification;
import com.inventory.domain.ports.in.NotificationQueryPort;
import com.inventory.domain.ports.out.NotificationReadRepository;
import com.inventory.domain.ports.out.NotificationRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: consultas sobre notificaciones del usuario.
 */
@Service
public class NotificationQueryUseCase implements NotificationQueryPort {

    private final NotificationRepository notificationRepository;
    private final NotificationReadRepository notificationReadRepository;

    public NotificationQueryUseCase(NotificationRepository notificationRepository,
                                     NotificationReadRepository notificationReadRepository) {
        this.notificationRepository = notificationRepository;
        this.notificationReadRepository = notificationReadRepository;
    }

    @Override
    public Flux<Notification> listForUser(UUID userId, boolean includeRead) {
        if (includeRead) {
            return notificationRepository.findByUserId(userId)
                .mergeWith(notificationRepository.findBroadcast())
                .distinct(Notification::id);
        }
        return notificationRepository.findUnreadByUserId(userId);
    }

    @Override
    public Mono<Long> getUnreadCount(UUID userId) {
        return notificationReadRepository.countUnreadByUserId(userId);
    }

    @Override
    public Flux<Notification> listSystemNotifications(UUID userId, Pageable pageable) {
        // Obtener notificaciones del sistema (source=SYSTEM)
        return notificationRepository.findByUserId(userId)
            .filter(n -> n.source() != null && "SYSTEM".equals(n.source().name()))
            .skip(pageable.getOffset())
            .take(pageable.getPageSize());
    }

    @Override
    public Flux<Notification> listUserNotifications(UUID userId, Pageable pageable) {
        // Obtener notificaciones de otros usuarios (source=USER)
        return notificationRepository.findByUserId(userId)
            .mergeWith(notificationRepository.findBroadcast())
            .filter(n -> n.source() != null && "USER".equals(n.source().name()))
            .distinct(Notification::id)
            .skip(pageable.getOffset())
            .take(pageable.getPageSize());
    }
}
