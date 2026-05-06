package com.inventory.application.usecase;

import java.util.UUID;

/**
 * Query: Obtener horarios silenciosos (quiet hours) del usuario.
 */
public record GetNotificationScheduleQuery(
    UUID userId
) {
}
