package com.inventory.application.service;

import com.inventory.adapters.persistence.entity.NotificationPreferencesEntity;
import com.inventory.adapters.persistence.repository.NotificationPreferencesR2dbcRepository;
import com.inventory.application.dto.NotificationPreferencesResponse;
import com.inventory.application.dto.UpdateNotificationPreferencesRequest;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.model.NotificationPreference;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

/**
 * Servicio para gestionar preferencias de notificación del usuario.
 */
@Service
public class NotificationPreferencesService {

    private final NotificationPreferencesR2dbcRepository repository;
    private final SupplementaryApplicationMapper mapper;

    public NotificationPreferencesService(
        NotificationPreferencesR2dbcRepository repository,
        SupplementaryApplicationMapper mapper
    ) {
        this.repository = repository;
        this.mapper = mapper;
    }

    /**
     * Obtiene las preferencias del usuario, o crea defaults si no existen.
     */
    public Mono<NotificationPreferencesResponse> getPreferences(UUID userId) {
        return repository.findByUserId(userId)
            .map(mapper::toNotificationPreferencesResponse)
            .switchIfEmpty(
                Mono.defer(() -> {
                    NotificationPreferencesEntity entity = new NotificationPreferencesEntity();
                    entity.setId(UUID.randomUUID());
                    entity.setUserId(userId);
                    entity.setEnabled(true);
                    entity.setLowStockEnabled(true);
                    entity.setSyncEnabled(true);
                    entity.setOperationsEnabled(true);
                    entity.setDebtEnabled(true);
                    entity.setUserActionsEnabled(true);
                    entity.setSystemEnabled(true);
                    entity.setPushNotificationsEnabled(false);
                    entity.setToastNotificationsEnabled(true);
                    entity.setSseEnabled(true);
                    entity.setSoundEnabled(true);
                    entity.setDesktopNotificationEnabled(false);
                    entity.setCreatedAt(Instant.now());
                    entity.setUpdatedAt(Instant.now());
                    entity.setNew(true);
                    return repository.save(entity)
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
        return repository.findByUserId(userId)
            .switchIfEmpty(Mono.error(new RuntimeException("Preferences not found for user: " + userId)))
            .flatMap(entity -> {
                // Actualizar campos si vienen en la request
                if (request.enabled() != null) entity.setEnabled(request.enabled());
                if (request.lowStockEnabled() != null) entity.setLowStockEnabled(request.lowStockEnabled());
                if (request.syncEnabled() != null) entity.setSyncEnabled(request.syncEnabled());
                if (request.operationsEnabled() != null) entity.setOperationsEnabled(request.operationsEnabled());
                if (request.debtEnabled() != null) entity.setDebtEnabled(request.debtEnabled());
                if (request.userActionsEnabled() != null) entity.setUserActionsEnabled(request.userActionsEnabled());
                if (request.systemEnabled() != null) entity.setSystemEnabled(request.systemEnabled());
                if (request.pushNotificationsEnabled() != null) entity.setPushNotificationsEnabled(request.pushNotificationsEnabled());
                if (request.toastNotificationsEnabled() != null) entity.setToastNotificationsEnabled(request.toastNotificationsEnabled());
                if (request.sseEnabled() != null) entity.setSseEnabled(request.sseEnabled());
                if (request.soundEnabled() != null) entity.setSoundEnabled(request.soundEnabled());
                if (request.desktopNotificationEnabled() != null) entity.setDesktopNotificationEnabled(request.desktopNotificationEnabled());
                
                entity.setUpdatedAt(Instant.now());
                entity.setNew(false);
                return repository.save(entity);
            })
            .map(mapper::toNotificationPreferencesResponse);
    }
}
