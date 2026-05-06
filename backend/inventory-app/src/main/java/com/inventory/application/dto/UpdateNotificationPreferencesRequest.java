package com.inventory.application.dto;

import java.util.List;

/**
 * DTO de request: Actualizar preferencias de notificación del usuario.
 * Usado en PUT /notifications/preferences
 */
public record UpdateNotificationPreferencesRequest(
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
    Boolean desktopNotificationEnabled
) {
    // Validation can be added in domain/application layer
}
