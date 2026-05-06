package com.inventory.application.usecase;

import org.springframework.data.domain.Pageable;
import java.util.UUID;

/**
 * Query: Obtener notificaciones de otros usuarios para el usuario (filtrado por source=USER).
 */
public record GetUserNotificationsQuery(
    UUID userId,
    Pageable pageable
) {
}
