package com.inventory.adapters.persistence.entity;

import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad de persistencia para notification_reads.
 * Clave primaria compuesta (notification_id, user_id) — no usa Persistable ni @Id único.
 * Se gestiona via INSERT ON CONFLICT DO NOTHING en el repositorio.
 */
@Table("notification_reads")
public class NotificationReadEntity {

    @Column("notification_id")
    private UUID notificationId;

    @Column("user_id")
    private UUID userId;

    @Column("read_at")
    private Instant readAt;

    public NotificationReadEntity() {}

    public NotificationReadEntity(UUID notificationId, UUID userId, Instant readAt) {
        this.notificationId = notificationId;
        this.userId = userId;
        this.readAt = readAt;
    }

    public UUID getNotificationId() { return notificationId; }
    public void setNotificationId(UUID notificationId) { this.notificationId = notificationId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public Instant getReadAt() { return readAt; }
    public void setReadAt(Instant readAt) { this.readAt = readAt; }
}
