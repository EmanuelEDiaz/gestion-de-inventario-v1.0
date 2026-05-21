package com.inventory.domain.model.notification;

import java.time.Instant;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Horarios silenciosos (quiet hours) para notificaciones del usuario.
 * Define cuándo no desea recibir notificaciones (excepto críticas si así lo configuró).
 */
public record NotificationSchedule(
    UUID id,
    UUID userId,
    
    LocalTime quietHoursStart,      // e.g., 22:00
    LocalTime quietHoursEnd,        // e.g., 08:00
    Boolean quietHoursEnabled,
    
    List<Integer> quietDaysList,    // [0=MON, 1=TUE, ..., 6=SUN]
    Boolean bypassOnCritical,       // CRITICAL notifications bypass quiet hours
    
    Instant createdAt,
    Instant updatedAt
) {
    public NotificationSchedule {
        if (id == null) id = UUID.randomUUID();
        if (userId == null) throw new IllegalArgumentException("userId cannot be null");
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        
        // Defaults
        if (quietHoursStart == null) quietHoursStart = LocalTime.of(22, 0);
        if (quietHoursEnd == null) quietHoursEnd = LocalTime.of(8, 0);
        if (quietHoursEnabled == null) quietHoursEnabled = false;
        if (quietDaysList == null) quietDaysList = List.of();
        if (bypassOnCritical == null) bypassOnCritical = true;
    }

    public static NotificationSchedule createDefault(UUID userId) {
        return new NotificationSchedule(
            UUID.randomUUID(), userId,
            LocalTime.of(22, 0), LocalTime.of(8, 0), false,
            List.of(), true,
            Instant.now(), Instant.now()
        );
    }

    public boolean isInQuietHours(LocalTime now) {
        if (quietHoursEnabled == null || !quietHoursEnabled) {
            return false;
        }
        
        // Wrap-around midnight case (e.g., 22:00-08:00)
        if (quietHoursStart.isAfter(quietHoursEnd)) {
            return !now.isBefore(quietHoursStart) || now.isBefore(quietHoursEnd);
        }
        
        // Normal case (e.g., 08:00-22:00)
        return !now.isBefore(quietHoursStart) && now.isBefore(quietHoursEnd);
    }

    public boolean isQuietDay(int dayOfWeek) {
        if (quietDaysList == null || quietDaysList.isEmpty()) {
            return false;
        }
        return quietDaysList.contains(dayOfWeek);
    }

    public boolean shouldDeliverNotification(String priority, LocalTime now, int dayOfWeek) {
        // CRITICAL notifications bypass quiet hours if configured
        if ("CRITICAL".equals(priority) && (bypassOnCritical == null || bypassOnCritical)) {
            return true;
        }
        
        // Check quiet hours and days
        boolean inQuietPeriod = isInQuietHours(now) || isQuietDay(dayOfWeek);
        return !inQuietPeriod;
    }
}
