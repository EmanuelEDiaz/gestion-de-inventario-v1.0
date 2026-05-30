package com.inventory.adapters.persistence.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * R2DBC entity for device_cursors table.
 * Tracks the last sync cursor seen by each device (mobile, browser, etc.)
 * to enable multi-device delta sync.
 */
@Table("device_cursors")
public class DeviceCursorEntity {
    @Id
    private UUID deviceId;

    @Column("user_id")
    private UUID userId;

    @Column("last_cursor")
    private Long lastCursor;

    @Column("last_seen_at")
    private Instant lastSeenAt;

    @Column("user_agent")
    private String userAgent;

    @Column("created_at")
    private Instant createdAt;

    // Constructors
    public DeviceCursorEntity() {
    }

    public DeviceCursorEntity(UUID deviceId, UUID userId, Long lastCursor, Instant lastSeenAt, String userAgent, Instant createdAt) {
        this.deviceId = deviceId;
        this.userId = userId;
        this.lastCursor = lastCursor;
        this.lastSeenAt = lastSeenAt;
        this.userAgent = userAgent;
        this.createdAt = createdAt;
    }

    public static DeviceCursorEntity create(UUID deviceId, UUID userId, String userAgent) {
        return new DeviceCursorEntity(
            deviceId,
            userId,
            0L,
            Instant.now(),
            userAgent,
            Instant.now()
        );
    }

    // Getters / Setters
    public UUID getDeviceId() { return deviceId; }
    public void setDeviceId(UUID deviceId) { this.deviceId = deviceId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public Long getLastCursor() { return lastCursor; }
    public void setLastCursor(Long lastCursor) { this.lastCursor = lastCursor; }

    public Instant getLastSeenAt() { return lastSeenAt; }
    public void setLastSeenAt(Instant lastSeenAt) { this.lastSeenAt = lastSeenAt; }

    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DeviceCursorEntity that = (DeviceCursorEntity) o;
        return Objects.equals(deviceId, that.deviceId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(deviceId);
    }
}
