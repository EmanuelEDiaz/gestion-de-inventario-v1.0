package com.inventory.domain.model;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Entidad de dominio: Notificación interna.
 * Mensajes del sistema o manuales que se muestran en el inbox del usuario.
 */
public record Notification(
    UUID id,
    NotificationSource source,
    NotificationCategory category,
    NotificationPriority priority,
    String title,
    String body,
    String actionUrl,
    List<String> tags,
    String deliveryChannel,
    TargetType targetType,
    UUID targetUserId,
    UUID createdBy,
    String entityType,
    UUID entityId,
    Instant createdAt
) {
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

    public enum NotificationCategory {
        // INVENTORY (5)
        LOW_STOCK("Stock bajo"),
        EXPIRED_SOON("Próximo a expirar"),
        OVERSTOCK("Exceso de stock"),
        PRODUCT_CREATED("Producto creado"),
        PRODUCT_MODIFIED("Producto modificado"),

        // SYNC & OFFLINE (4)
        SYNC_CONFLICT("Conflicto de sincronización"),
        SYNC_COMPLETED("Sincronización completada"),
        OFFLINE_AVAILABLE("Disponible offline"),
        ONLINE_RECONNECTED("Reconectado"),

        // OPERATIONS (4)
        IMPORT_DONE("Importación completada"),
        EXPORT_DONE("Exportación lista"),
        BULK_UPDATE("Actualización masiva completada"),
        REPORT_GENERATED("Reporte generado"),

        // CREDIT & DEBT (3)
        DEBT_OVERDUE("Deuda vencida"),
        CREDIT_LIMIT_REACHED("Límite de crédito alcanzado"),
        PAYMENT_RECEIVED("Pago recibido"),

        // USER ACTIONS (4)
        MENTION("Mención de usuario"),
        COMMENT("Comentario"),
        APPROVAL_NEEDED("Aprobación requerida"),
        TASK_ASSIGNED("Tarea asignada"),

        // SYSTEM (3)
        MAINTENANCE("Mantenimiento"),
        MANUAL("Manual"),
        ALERT("Alerta del sistema");

        private final String label;

        NotificationCategory(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }

    public enum TargetType {
        USER, ALL
    }

    public Notification {
        if (source == null) throw new IllegalArgumentException("source cannot be null");
        if (category == null) throw new IllegalArgumentException("category cannot be null");
        if (priority == null) throw new IllegalArgumentException("priority cannot be null");
        if (title == null || title.isBlank()) throw new IllegalArgumentException("title cannot be blank");
        if (targetType == null) throw new IllegalArgumentException("targetType cannot be null");
        if (targetType == TargetType.USER && targetUserId == null)
            throw new IllegalArgumentException("targetUserId required when targetType is USER");
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
        if (tags == null) tags = List.of();
        if (deliveryChannel == null) deliveryChannel = "SSE";
    }

    public static Notification createSystem(NotificationCategory category, NotificationPriority priority,
                                            String title, String body, TargetType targetType,
                                            UUID targetUserId, String entityType, UUID entityId) {
        return new Notification(
            UUID.randomUUID(),
            NotificationSource.SYSTEM,
            category,
            priority,
            title,
            body,
            null,
            List.of(),
            "SSE",
            targetType,
            targetUserId,
            null,
            entityType,
            entityId,
            Instant.now()
        );
    }

    public static Notification createManual(String title, String body, TargetType targetType,
                                            UUID targetUserId, UUID createdBy) {
        return new Notification(
            UUID.randomUUID(),
            NotificationSource.USER,
            NotificationCategory.MANUAL,
            NotificationPriority.MEDIUM,
            title,
            body,
            null,
            List.of(),
            "SSE",
            targetType,
            targetUserId,
            createdBy,
            null,
            null,
            Instant.now()
        );
    }
}
