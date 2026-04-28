package com.inventory.adapters.persistence.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("sync_incidents")
public class SyncIncidentEntity implements Persistable<UUID> {

    @Id
    private UUID id;

    @Column("device_id")
    private String deviceId;

    @Column("operation_id")
    private String operationId;

    @Column("entity_type")
    private String entityType;

    @Column("entity_id")
    private String entityId;

    @Column("incident_type")
    private String incidentType;

    @Column("status")
    private String status;

    @Column("my_payload")
    private String myPayload;

    @Column("server_payload")
    private String serverPayload;

    @Column("resolution")
    private String resolution;

    @Column("user_id")
    private UUID userId;

    @Column("created_at")
    private Instant createdAt;

    @Column("resolved_at")
    private Instant resolvedAt;

    @Transient
    private boolean isNew = true;

    public SyncIncidentEntity() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getOperationId() { return operationId; }
    public void setOperationId(String operationId) { this.operationId = operationId; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public String getIncidentType() { return incidentType; }
    public void setIncidentType(String incidentType) { this.incidentType = incidentType; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getMyPayload() { return myPayload; }
    public void setMyPayload(String myPayload) { this.myPayload = myPayload; }

    public String getServerPayload() { return serverPayload; }
    public void setServerPayload(String serverPayload) { this.serverPayload = serverPayload; }

    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }

    @Override
    public boolean isNew() { return isNew; }
    public void setNew(boolean isNew) { this.isNew = isNew; }
}
