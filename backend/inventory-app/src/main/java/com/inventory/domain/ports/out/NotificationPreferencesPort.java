package com.inventory.domain.ports.out;

import com.inventory.domain.model.NotificationPreference;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface NotificationPreferencesPort {
    Mono<NotificationPreference> findByUserId(UUID userId);
    Mono<NotificationPreference> save(NotificationPreference preference);
}
