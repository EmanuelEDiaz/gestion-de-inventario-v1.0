package com.inventory.application.usecase;

import org.springframework.data.domain.Pageable;
import java.util.UUID;

/**
 * Query: Obtener notificaciones del sistema para el usuario (filtrado por source=SYSTEM).
 */
public record GetSystemNotificationsQuery(
    UUID userId,
    Pageable pageable
) {
}
