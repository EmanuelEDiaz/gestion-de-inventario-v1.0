package com.inventory.domain.model.audit;

import java.time.Instant;
import java.util.UUID;

public class AuditLog {
    private final UUID id;
    private final UUID actorId;
    private final String entityType;
    private final UUID entityId;
    private final String action;
    private final String beforeData;
    private final String afterData;
    private final String ipAddress;
    private final Instant createdAt;

    public AuditLog(UUID id, UUID actorId, String entityType, UUID entityId,
                    String action, String beforeData, String afterData,
                    String ipAddress, Instant createdAt) {
        this.id = id != null ? id : UUID.randomUUID();
        this.actorId = actorId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
        this.beforeData = beforeData;
        this.afterData = afterData;
        this.ipAddress = ipAddress;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public static AuditLog create(UUID actorId, String entityType, UUID entityId,
                                   String action, String beforeData, String afterData,
                                   String ipAddress) {
        return new AuditLog(UUID.randomUUID(), actorId, entityType, entityId,
            action, beforeData, afterData, ipAddress, Instant.now());
    }

    public UUID getId() { return id; }
    public UUID getActorId() { return actorId; }
    public String getEntityType() { return entityType; }
    public UUID getEntityId() { return entityId; }
    public String getAction() { return action; }
    public String getBeforeData() { return beforeData; }
    public String getAfterData() { return afterData; }
    public String getIpAddress() { return ipAddress; }
    public Instant getCreatedAt() { return createdAt; }
}
