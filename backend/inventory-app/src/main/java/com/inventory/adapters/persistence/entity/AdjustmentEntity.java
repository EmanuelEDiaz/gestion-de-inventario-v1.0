package com.inventory.adapters.persistence.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Entidad R2DBC: Ajuste de inventario.
 */
@Table("adjustments")
public class AdjustmentEntity {

    @Id
    private UUID id;

    @Column("adjustment_number")
    private String adjustmentNumber;

    @Column("warehouse_id")
    private UUID warehouseId;

    @Column("type")
    private String type;

    @Column("status")
    private String status;

    @Column("reason")
    private String reason;

    @Column("notes")
    private String notes;

    @Column("adjustment_date")
    private LocalDate adjustmentDate;

    @Column("created_by")
    private UUID createdBy;

    @Column("created_at")
    private Instant createdAt;

    @Column("updated_at")
    private Instant updatedAt;

    public AdjustmentEntity() {}

    public AdjustmentEntity(UUID id, String adjustmentNumber, UUID warehouseId, String type,
                            String status, String reason, String notes, LocalDate adjustmentDate,
                            UUID createdBy, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.adjustmentNumber = adjustmentNumber;
        this.warehouseId = warehouseId;
        this.type = type;
        this.status = status;
        this.reason = reason;
        this.notes = notes;
        this.adjustmentDate = adjustmentDate;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters & Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getAdjustmentNumber() { return adjustmentNumber; }
    public void setAdjustmentNumber(String adjustmentNumber) { this.adjustmentNumber = adjustmentNumber; }
    public UUID getWarehouseId() { return warehouseId; }
    public void setWarehouseId(UUID warehouseId) { this.warehouseId = warehouseId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDate getAdjustmentDate() { return adjustmentDate; }
    public void setAdjustmentDate(LocalDate adjustmentDate) { this.adjustmentDate = adjustmentDate; }
    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
