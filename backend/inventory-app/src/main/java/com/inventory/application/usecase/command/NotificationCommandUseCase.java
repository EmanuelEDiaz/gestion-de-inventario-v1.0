package com.inventory.application.usecase.command;

import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.notification.Notification;
import com.inventory.domain.model.notification.NotificationRead;
import com.inventory.domain.ports.in.NotificationCommandPort;
import com.inventory.domain.ports.out.NotificationReadRepository;
import com.inventory.domain.ports.out.NotificationRepository;
import com.inventory.domain.ports.out.NotificationSinkPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: comandos sobre notificaciones internas.
 * Cubre: crear, despachar del sistema, marcar leída, marcar todas leídas.
 */
@Service
public class NotificationCommandUseCase implements NotificationCommandPort {

    private final NotificationRepository notificationRepository;
    private final NotificationReadRepository notificationReadRepository;
    private final NotificationSinkPort notificationSinkPort;

    public NotificationCommandUseCase(NotificationRepository notificationRepository,
                                       NotificationReadRepository notificationReadRepository,
                                       NotificationSinkPort notificationSinkPort) {
        this.notificationRepository = notificationRepository;
        this.notificationReadRepository = notificationReadRepository;
        this.notificationSinkPort = notificationSinkPort;
    }

    @Override
    public Mono<Notification> create(CreateCommand command) {
        Notification notification = Notification.createManual(
            command.title(),
            command.body(),
            command.targetType(),
            command.targetUserId(),
            command.createdBy()
        );
        return notificationRepository.save(notification)
            .flatMap(saved -> notificationSinkPort.emit(saved).thenReturn(saved));
    }

    @Override
    public Mono<Void> dispatchSystem(Notification notification) {
        return notificationRepository.save(notification)
            .flatMap(saved -> notificationSinkPort.emit(saved))
            .then();
    }

    @Override
    public Mono<Void> markRead(UUID notificationId, UUID userId) {
        return notificationRepository.findById(notificationId)
            .switchIfEmpty(Mono.error(new NotFoundException("Notification not found: " + notificationId)))
            .flatMap(n -> notificationReadRepository.save(NotificationRead.of(notificationId, userId)))
            .then();
    }

    @Override
    public Mono<Void> deleteById(UUID notificationId, UUID userId) {
        return notificationRepository.findById(notificationId)
            .switchIfEmpty(Mono.error(new NotFoundException("Notification not found: " + notificationId)))
            .flatMap(n -> notificationRepository.deleteById(notificationId));
    }

    @Override
    public Mono<Void> markAllRead(UUID userId) {
        return notificationRepository.findByUserId(userId)
            .concatWith(notificationRepository.findBroadcast())
            .flatMap(n -> notificationReadRepository.hasRead(n.id(), userId)
                .filter(alreadyRead -> !alreadyRead)
                .flatMap(notRead -> notificationReadRepository.save(NotificationRead.of(n.id(), userId)))
            )
            .then();
    }
}
