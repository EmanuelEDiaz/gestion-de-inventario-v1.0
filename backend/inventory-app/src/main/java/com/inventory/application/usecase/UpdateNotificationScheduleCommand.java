package com.inventory.application.usecase;

import com.inventory.application.dto.UpdateNotificationScheduleRequest;
import java.util.UUID;

/**
 * Command: Actualizar horarios silenciosos (quiet hours) del usuario.
 */
public record UpdateNotificationScheduleCommand(
    UUID userId,
    UpdateNotificationScheduleRequest request
) {
}
