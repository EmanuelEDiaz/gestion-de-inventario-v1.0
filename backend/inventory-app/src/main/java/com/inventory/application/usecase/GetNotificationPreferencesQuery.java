package com.inventory.application.usecase;

import java.util.UUID;

/**
 * Query: Obtener preferencias de notificación del usuario.
 */
public record GetNotificationPreferencesQuery(
    UUID userId
) {
}
