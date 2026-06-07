package com.inventory.domain.model.sync;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain model: per-device sync cursor.
 * Tracks the last sync cursor seen by each device (mobile, browser, etc.)
 * to enable multi-device delta sync. Pure domain — no framework dependencies.
 */
public class DeviceCursor {

    private final UUID deviceId;
    private final UUID userId;
    private final Long lastCursor;
    private final Instant lastSeenAt;
    private final String userAgent;
    private final Instant createdAt;

    public DeviceCursor(UUID deviceId, UUID userId, Long lastCursor,
                        Instant lastSeenAt, String userAgent, Instant createdAt) {
        if (deviceId == null) throw new IllegalArgumentException("deviceId cannot be null");
        this.deviceId = deviceId;
        this.userId = userId;
        this.lastCursor = lastCursor;
        this.lastSeenAt = lastSeenAt;
        this.userAgent = userAgent;
        this.createdAt = createdAt;
    }

    public static DeviceCursor create(UUID deviceId, UUID userId, String userAgent) {
        Instant now = Instant.now();
        return new DeviceCursor(deviceId, userId, 0L, now, userAgent, now);
    }

    public DeviceCursor withCursor(long cursor) {
        return new DeviceCursor(deviceId, userId, cursor, Instant.now(), userAgent, createdAt);
    }

    public UUID getDeviceId() { return deviceId; }
    public UUID getUserId() { return userId; }
    public Long getLastCursor() { return lastCursor; }
    public Instant getLastSeenAt() { return lastSeenAt; }
    public String getUserAgent() { return userAgent; }
    public Instant getCreatedAt() { return createdAt; }
}
