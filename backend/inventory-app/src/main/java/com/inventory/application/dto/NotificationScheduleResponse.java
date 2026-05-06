package com.inventory.application.dto;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO de respuesta: Horarios silenciosos (quiet hours) del usuario.
 * Usado en GET /notifications/schedules
 */
public record NotificationScheduleResponse(
    UUID id,
    UUID userId,
    
    LocalTime quietHoursStart,      // e.g., "22:00"
    LocalTime quietHoursEnd,        // e.g., "08:00"
    Boolean quietHoursEnabled,
    
    List<Integer> quietDaysList,    // [0=MON, 1=TUE, ..., 6=SUN]
    Boolean bypassOnCritical,       // CRITICAL notifications bypass quiet hours
    
    Instant createdAt,
    Instant updatedAt
) {
}
