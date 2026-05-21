package com.inventory.domain.ports.out;

import com.inventory.domain.model.notification.NotificationSchedule;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface NotificationSchedulesPort {
    Mono<NotificationSchedule> findByUserId(UUID userId);
    Mono<NotificationSchedule> save(NotificationSchedule schedule);
}
