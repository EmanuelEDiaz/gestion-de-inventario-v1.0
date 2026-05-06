package com.inventory.application.service;

import com.inventory.adapters.persistence.entity.NotificationSchedulesEntity;
import com.inventory.adapters.persistence.repository.NotificationSchedulesR2dbcRepository;
import com.inventory.application.dto.NotificationScheduleResponse;
import com.inventory.application.dto.UpdateNotificationScheduleRequest;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Servicio para gestionar horarios silenciosos (quiet hours) del usuario.
 */
@Service
public class NotificationSchedulesService {

    private final NotificationSchedulesR2dbcRepository repository;
    private final SupplementaryApplicationMapper mapper;

    public NotificationSchedulesService(
        NotificationSchedulesR2dbcRepository repository,
        SupplementaryApplicationMapper mapper
    ) {
        this.repository = repository;
        this.mapper = mapper;
    }

    /**
     * Obtiene los horarios silenciosos del usuario, o crea defaults si no existen.
     */
    public Mono<NotificationScheduleResponse> getSchedule(UUID userId) {
        return repository.findByUserId(userId)
            .map(mapper::toNotificationScheduleResponse)
            .switchIfEmpty(
                Mono.defer(() -> {
                    NotificationSchedulesEntity entity = new NotificationSchedulesEntity();
                    entity.setId(UUID.randomUUID());
                    entity.setUserId(userId);
                    entity.setQuietHoursStart(LocalTime.of(22, 0));
                    entity.setQuietHoursEnd(LocalTime.of(8, 0));
                    entity.setQuietHoursEnabled(false);
                    entity.setQuietDaysList(new Integer[]{});
                    entity.setBypassOnCritical(true);
                    entity.setCreatedAt(Instant.now());
                    entity.setUpdatedAt(Instant.now());
                    entity.setNew(true);
                    return repository.save(entity)
                        .map(mapper::toNotificationScheduleResponse);
                })
            );
    }

    /**
     * Actualiza los horarios silenciosos del usuario.
     */
    public Mono<NotificationScheduleResponse> updateSchedule(
        UUID userId,
        UpdateNotificationScheduleRequest request
    ) {
        return repository.findByUserId(userId)
            .switchIfEmpty(Mono.error(new RuntimeException("Schedule not found for user: " + userId)))
            .flatMap(entity -> {
                // Actualizar campos si vienen en la request
                if (request.quietHoursStart() != null) entity.setQuietHoursStart(request.quietHoursStart());
                if (request.quietHoursEnd() != null) entity.setQuietHoursEnd(request.quietHoursEnd());
                if (request.quietHoursEnabled() != null) entity.setQuietHoursEnabled(request.quietHoursEnabled());
                if (request.quietDaysList() != null) {
                    entity.setQuietDaysList(request.quietDaysList().toArray(new Integer[0]));
                }
                if (request.bypassOnCritical() != null) entity.setBypassOnCritical(request.bypassOnCritical());
                
                entity.setUpdatedAt(Instant.now());
                entity.setNew(false);
                return repository.save(entity);
            })
            .map(mapper::toNotificationScheduleResponse);
    }
}
