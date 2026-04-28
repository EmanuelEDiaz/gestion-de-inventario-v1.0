package com.inventory.domain.model;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad de dominio: Incidencia de sincronización.
 * Registra conflictos detectados durante el proceso de sync offline-first.
 * Máquina de estados: PENDING → RESOLVED / IGNORED
 */
public class SyncIncident {

    public enum IncidentType {
        ENTITY_DUPLICATE, STOCK_CONFLICT, VERSION_MISMATCH, CHECKSUM_ERROR
    }

    public enum IncidentStatus {
        PENDING, RESOLVED, IGNORED
    }

    private final UUID id;
    private final String deviceId;
    private final String operationId;
    private final String entityType;
    private final String entityId;
    private final IncidentType incidentType;
    private final IncidentStatus status;
    private final String myPayload;
    private final String serverPayload;
    private final String resolution;
    private final UUID userId;
    private final Instant createdAt;
    private final Instant resolvedAt;

    public SyncIncident(UUID id, String deviceId, String operationId,
                        String entityType, String entityId, IncidentType incidentType,
                        IncidentStatus status, String myPayload, String serverPayload,
                        String resolution, UUID userId, Instant createdAt, Instant resolvedAt) {
        if (deviceId == null || deviceId.isBlank()) throw new IllegalArgumentException("deviceId cannot be blank");
        if (operationId == null || operationId.isBlank()) throw new IllegalArgumentException("operationId cannot be blank");
        if (entityType == null || entityType.isBlank()) throw new IllegalArgumentException("entityType cannot be blank");
        if (entityId == null || entityId.isBlank()) throw new IllegalArgumentException("entityId cannot be blank");
        if (incidentType == null) throw new IllegalArgumentException("incidentType cannot be null");
        if (status == null) throw new IllegalArgumentException("status cannot be null");
        this.id = id != null ? id : UUID.randomUUID();
        this.deviceId = deviceId;
        this.operationId = operationId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.incidentType = incidentType;
        this.status = status;
        this.myPayload = myPayload;
        this.serverPayload = serverPayload;
        this.resolution = resolution;
        this.userId = userId;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
        this.resolvedAt = resolvedAt;
    }

    public static SyncIncident create(String deviceId, String operationId,
                                      String entityType, String entityId,
                                      IncidentType incidentType,
                                      String myPayload, String serverPayload,
                                      UUID userId) {
        return new SyncIncident(UUID.randomUUID(), deviceId, operationId,
                                entityType, entityId, incidentType,
                                IncidentStatus.PENDING, myPayload, serverPayload,
                                null, userId, Instant.now(), null);
    }

    public SyncIncident resolve(String resolution) {
        if (status != IncidentStatus.PENDING)
            throw new IllegalStateException("Only PENDING incidents can be resolved");
        return new SyncIncident(id, deviceId, operationId, entityType, entityId,
                                incidentType, IncidentStatus.RESOLVED, myPayload, serverPayload,
                                resolution, userId, createdAt, Instant.now());
    }

    public SyncIncident ignore() {
        if (status != IncidentStatus.PENDING)
            throw new IllegalStateException("Only PENDING incidents can be ignored");
        return new SyncIncident(id, deviceId, operationId, entityType, entityId,
                                incidentType, IncidentStatus.IGNORED, myPayload, serverPayload,
                                null, userId, createdAt, Instant.now());
    }

    // Getters
    public UUID getId() { return id; }
    public String getDeviceId() { return deviceId; }
    public String getOperationId() { return operationId; }
    public String getEntityType() { return entityType; }
    public String getEntityId() { return entityId; }
    public IncidentType getIncidentType() { return incidentType; }
    public IncidentStatus getStatus() { return status; }
    public String getMyPayload() { return myPayload; }
    public String getServerPayload() { return serverPayload; }
    public String getResolution() { return resolution; }
    public UUID getUserId() { return userId; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getResolvedAt() { return resolvedAt; }
}
