package com.inventory.adapters.persistence.adapter.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.OffsetDateTime;
import java.util.UUID;

@Table("sync_log")
public class SyncLogEntity {

    @Id
    private Long id;

    @Column("entity_type")
    private String entityType;

    @Column("entity_id")
    private UUID entityId;

    @Column("action")
    private String action;

    @Column("payload")
    private String payload;

    @Column("warehouse_id")
    private UUID warehouseId;

    @Column("created_at")
    private OffsetDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public UUID getEntityId() { return entityId; }
    public void setEntityId(UUID entityId) { this.entityId = entityId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }
    public UUID getWarehouseId() { return warehouseId; }
    public void setWarehouseId(UUID warehouseId) { this.warehouseId = warehouseId; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
