package com.inventory.domain.model;

/**
 * Prioridad de la notificación.
 * Define la urgencia y cómo se debe entregar.
 */
public enum NotificationPriority {
    LOW("Baja"),       // No urgente (informacional)
    MEDIUM("Media"),   // Normal (import_done, comentarios)
    HIGH("Alta"),      // Urgente (@mention, SYNC_CONFLICT)
    CRITICAL("Crítica"); // Crítica (DEBT_OVERDUE, límite de crédito)

    private final String label;

    NotificationPriority(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
