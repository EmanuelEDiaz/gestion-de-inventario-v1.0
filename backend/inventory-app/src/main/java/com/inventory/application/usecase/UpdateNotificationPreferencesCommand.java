package com.inventory.application.usecase;

import com.inventory.application.dto.UpdateNotificationPreferencesRequest;
import java.util.UUID;

/**
 * Command: Actualizar preferencias de notificación del usuario.
 */
public record UpdateNotificationPreferencesCommand(
    UUID userId,
    UpdateNotificationPreferencesRequest request
) {
}
