package com.inventory.domain.ports.in;

import com.inventory.domain.model.Notification;
import com.inventory.domain.shared.PageRequest;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface NotificationQueryPort {

    Flux<Notification> listForUser(UUID userId, boolean includeRead);

    Mono<Long> getUnreadCount(UUID userId);

    Flux<Notification> listSystemNotifications(UUID userId, PageRequest pageRequest);

    Flux<Notification> listUserNotifications(UUID userId, PageRequest pageRequest);
}
