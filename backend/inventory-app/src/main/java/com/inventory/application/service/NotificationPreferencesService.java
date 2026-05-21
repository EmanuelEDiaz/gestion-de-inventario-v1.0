package com.inventory.application.service;

import com.inventory.application.notification.dto.NotificationPreferencesResponse;
import com.inventory.application.notification.dto.UpdateNotificationPreferencesRequest;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.model.notification.NotificationPreference;
import com.inventory.domain.ports.out.NotificationPreferencesPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

/**
 * Servicio para gestionar preferencias de notificación del usuario.
 */
@Service
public class NotificationPreferencesService {

    private final NotificationPreferencesPort port;
    private final SupplementaryApplicationMapper mapper;

    public NotificationPreferencesService(
        NotificationPreferencesPort port,
        SupplementaryApplicationMapper mapper
    ) {
        this.port = port;
        this.mapper = mapper;
    }

    /**
     * Obtiene las preferencias del usuario, o crea defaults si no existen.
     */
    public Mono<NotificationPreferencesResponse> getPreferences(UUID userId) {
        return port.findByUserId(userId)
            .map(mapper::toNotificationPreferencesResponse)
            .switchIfEmpty(
                Mono.defer(() -> {
                    NotificationPreference domain = NotificationPreference.createDefault(userId);
                    return port.save(domain)
                        .map(mapper::toNotificationPreferencesResponse);
                })
            );
    }

    /**
     * Actualiza las preferencias del usuario.
     */
    public Mono<NotificationPreferencesResponse> updatePreferences(
        UUID userId,
        UpdateNotificationPreferencesRequest request
    ) {
        return port.findByUserId(userId)
            .switchIfEmpty(Mono.error(new RuntimeException("Preferences not found for user: " + userId)))
            .flatMap(pref -> {
                NotificationPreference updated = new NotificationPreference(
                    pref.id(), pref.userId(),
                    request.enabled() != null ? request.enabled() : pref.enabled(),
                    request.lowStockEnabled() != null ? request.lowStockEnabled() : pref.lowStockEnabled(),
                    request.syncEnabled() != null ? request.syncEnabled() : pref.syncEnabled(),
                    request.operationsEnabled() != null ? request.operationsEnabled() : pref.operationsEnabled(),
                    request.debtEnabled() != null ? request.debtEnabled() : pref.debtEnabled(),
                    request.userActionsEnabled() != null ? request.userActionsEnabled() : pref.userActionsEnabled(),
                    request.systemEnabled() != null ? request.systemEnabled() : pref.systemEnabled(),
                    request.pushNotificationsEnabled() != null ? request.pushNotificationsEnabled() : pref.pushNotificationsEnabled(),
                    request.toastNotificationsEnabled() != null ? request.toastNotificationsEnabled() : pref.toastNotificationsEnabled(),
                    request.sseEnabled() != null ? request.sseEnabled() : pref.sseEnabled(),
                    request.soundEnabled() != null ? request.soundEnabled() : pref.soundEnabled(),
                    request.desktopNotificationEnabled() != null ? request.desktopNotificationEnabled() : pref.desktopNotificationEnabled(),
                    pref.createdAt(),
                    Instant.now()
                );
                return port.save(updated);
            })
            .map(mapper::toNotificationPreferencesResponse);
    }
}
