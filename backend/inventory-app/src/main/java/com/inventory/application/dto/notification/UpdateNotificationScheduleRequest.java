package com.inventory.application.notification.dto;

import java.time.LocalTime;
import java.util.List;

/**
 * DTO de request: Actualizar horarios silenciosos (quiet hours) del usuario.
 * Usado en PUT /notifications/schedules
 */
public record UpdateNotificationScheduleRequest(
    LocalTime quietHoursStart,      // e.g., "22:00"
    LocalTime quietHoursEnd,        // e.g., "08:00"
    Boolean quietHoursEnabled,
    
    List<Integer> quietDaysList,    // [0=MON, 1=TUE, ..., 6=SUN]
    Boolean bypassOnCritical        // Si true, CRITICAL notifications se envían siempre
) {
    // Validation: start != end, days in range [0-6]
}
