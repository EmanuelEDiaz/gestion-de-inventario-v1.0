package com.inventory.domain.model.notification;

/**
 * Origen de la notificación.
 * Define quién o qué generó la notificación.
 */
public enum NotificationSource {
    SYSTEM("Sistema"),          // Eventos automáticos (stock, sync, etc)
    USER("Usuario"),            // Acciones de otros usuarios (@mention, comentarios)
    INTEGRATION("Integración"), // Webhooks/integraciones (futuro)
    SCHEDULED_TASK("Tarea");    // Tareas programadas (futuro)

    private final String label;

    NotificationSource(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
