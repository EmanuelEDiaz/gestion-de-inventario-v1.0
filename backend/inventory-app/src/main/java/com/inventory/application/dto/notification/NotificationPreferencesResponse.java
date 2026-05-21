package com.inventory.application.notification.dto;

import java.time.Instant;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO de respuesta: Preferencias de notificación del usuario.
 * Usado en GET /notifications/preferences
 */
public record NotificationPreferencesResponse(
    UUID id,
    UUID userId,
    
    // Global toggles
    Boolean enabled,
    
    // Per-category group toggles
    Boolean lowStockEnabled,
    Boolean syncEnabled,
    Boolean operationsEnabled,
    Boolean debtEnabled,
    Boolean userActionsEnabled,
    Boolean systemEnabled,
    
    // Delivery channels
    Boolean pushNotificationsEnabled,
    Boolean toastNotificationsEnabled,
    Boolean sseEnabled,
    
    // Sound & visual
    Boolean soundEnabled,
    Boolean desktopNotificationEnabled,
    
    Instant createdAt,
    Instant updatedAt
) {
}
