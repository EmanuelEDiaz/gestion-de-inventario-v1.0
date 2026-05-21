package com.inventory.application.notification.dto;

import com.inventory.domain.model.notification.Notification;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * DTO de respuesta: Notificación completa para API REST.
 * Usado en GET /notifications (sistema + usuarios).
 */
public record NotificationResponse(
    UUID id,
    String source,              // SYSTEM, USER, INTEGRATION, SCHEDULED_TASK
    String category,            // LOW_STOCK, SYNC_CONFLICT, MENTION, etc
    String priority,            // LOW, MEDIUM, HIGH, CRITICAL
    String title,
    String body,
    String actionUrl,           // Nullable: /products/123, /purchase/456
    List<String> tags,          // ["stock", "warehouse-1"], ["urgent"]
    String deliveryChannel,     // SSE, TOAST, PUSH
    String targetType,          // USER, ALL
    UUID targetUserId,
    UUID createdBy,
    String entityType,          // PRODUCT, SUPPLIER, etc
    UUID entityId,
    Instant createdAt,
    Boolean isRead              // Para el usuario actual
) {
    public static NotificationResponse from(Notification notification, Boolean isRead) {
        return new NotificationResponse(
            notification.id(),
            notification.source().name(),
            notification.category().name(),
            notification.priority().name(),
            notification.title(),
            notification.body(),
            notification.actionUrl(),
            notification.tags(),
            notification.deliveryChannel(),
            notification.targetType().name(),
            notification.targetUserId(),
            notification.createdBy(),
            notification.entityType(),
            notification.entityId(),
            notification.createdAt(),
            isRead
        );
    }
}
