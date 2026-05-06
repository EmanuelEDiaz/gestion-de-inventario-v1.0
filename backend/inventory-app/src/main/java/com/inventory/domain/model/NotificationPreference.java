package com.inventory.domain.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Preferencias de notificación del usuario.
 * Define qué tipos de notificaciones desea recibir y por qué canales.
 */
public record NotificationPreference(
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
    public NotificationPreference {
        if (id == null) id = UUID.randomUUID();
        if (userId == null) throw new IllegalArgumentException("userId cannot be null");
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        
        // Defaults
        if (enabled == null) enabled = true;
        if (lowStockEnabled == null) lowStockEnabled = true;
        if (syncEnabled == null) syncEnabled = true;
        if (operationsEnabled == null) operationsEnabled = true;
        if (debtEnabled == null) debtEnabled = true;
        if (userActionsEnabled == null) userActionsEnabled = true;
        if (systemEnabled == null) systemEnabled = true;
        if (pushNotificationsEnabled == null) pushNotificationsEnabled = false;
        if (toastNotificationsEnabled == null) toastNotificationsEnabled = true;
        if (sseEnabled == null) sseEnabled = true;
        if (soundEnabled == null) soundEnabled = true;
        if (desktopNotificationEnabled == null) desktopNotificationEnabled = false;
    }

    public static NotificationPreference createDefault(UUID userId) {
        return new NotificationPreference(
            UUID.randomUUID(), userId,
            true, true, true, true, true, true, true,
            false, true, true,
            true, false,
            Instant.now(), Instant.now()
        );
    }

    public boolean isGloballyEnabled() {
        return enabled != null && enabled;
    }

    public boolean isCategoryEnabled(String category) {
        return switch (category) {
            case "LOW_STOCK", "EXPIRED_SOON", "OVERSTOCK", "PRODUCT_CREATED", "PRODUCT_MODIFIED" 
                -> lowStockEnabled != null && lowStockEnabled;
            case "SYNC_CONFLICT", "SYNC_COMPLETED", "OFFLINE_AVAILABLE", "ONLINE_RECONNECTED" 
                -> syncEnabled != null && syncEnabled;
            case "IMPORT_DONE", "EXPORT_DONE", "BULK_UPDATE", "REPORT_GENERATED" 
                -> operationsEnabled != null && operationsEnabled;
            case "DEBT_OVERDUE", "CREDIT_LIMIT_REACHED", "PAYMENT_RECEIVED" 
                -> debtEnabled != null && debtEnabled;
            case "MENTION", "COMMENT", "APPROVAL_NEEDED", "TASK_ASSIGNED" 
                -> userActionsEnabled != null && userActionsEnabled;
            case "MAINTENANCE", "MANUAL", "ALERT" 
                -> systemEnabled != null && systemEnabled;
            default -> false;
        };
    }
}
