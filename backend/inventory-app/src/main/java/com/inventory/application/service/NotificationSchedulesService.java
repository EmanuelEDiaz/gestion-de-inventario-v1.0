package com.inventory.application.service;

import com.inventory.application.dto.NotificationScheduleResponse;
import com.inventory.application.dto.UpdateNotificationScheduleRequest;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.model.NotificationSchedule;
import com.inventory.domain.ports.out.NotificationSchedulesPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

/**
 * Servicio para gestionar horarios silenciosos (quiet hours) del usuario.
 */
@Service
public class NotificationSchedulesService {

    private final NotificationSchedulesPort port;
    private final SupplementaryApplicationMapper mapper;

    public NotificationSchedulesService(
        NotificationSchedulesPort port,
        SupplementaryApplicationMapper mapper
    ) {
        this.port = port;
        this.mapper = mapper;
    }

    /**
     * Obtiene los horarios silenciosos del usuario, o crea defaults si no existen.
     */
    public Mono<NotificationScheduleResponse> getSchedule(UUID userId) {
        return port.findByUserId(userId)
            .map(mapper::toNotificationScheduleResponse)
            .switchIfEmpty(
                Mono.defer(() -> {
                    NotificationSchedule domain = NotificationSchedule.createDefault(userId);
                    return port.save(domain)
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
        return port.findByUserId(userId)
            .switchIfEmpty(Mono.error(new RuntimeException("Schedule not found for user: " + userId)))
            .flatMap(schedule -> {
                NotificationSchedule updated = new NotificationSchedule(
                    schedule.id(), schedule.userId(),
                    request.quietHoursStart() != null ? request.quietHoursStart() : schedule.quietHoursStart(),
                    request.quietHoursEnd() != null ? request.quietHoursEnd() : schedule.quietHoursEnd(),
                    request.quietHoursEnabled() != null ? request.quietHoursEnabled() : schedule.quietHoursEnabled(),
                    request.quietDaysList() != null ? request.quietDaysList() : schedule.quietDaysList(),
                    request.bypassOnCritical() != null ? request.bypassOnCritical() : schedule.bypassOnCritical(),
                    schedule.createdAt(),
                    Instant.now()
                );
                return port.save(updated);
            })
            .map(mapper::toNotificationScheduleResponse);
    }
}
