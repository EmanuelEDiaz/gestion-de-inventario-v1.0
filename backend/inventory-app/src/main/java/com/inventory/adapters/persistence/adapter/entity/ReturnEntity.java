package com.inventory.adapters.persistence.adapter.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Entidad R2DBC: Devolución.
 */
@Table("returns")
public class ReturnEntity {

    @Id
    private UUID id;

    @Column("return_number")
    private String returnNumber;

    @Column("type")
    private String type;

    @Column("warehouse_id")
    private UUID warehouseId;

    @Column("original_document_id")
    private UUID originalDocumentId;

    @Column("status")
    private String status;

    @Column("reason")
    private String reason;

    @Column("notes")
    private String notes;

    @Column("return_date")
    private LocalDate returnDate;

    @Column("created_by")
    private UUID createdBy;

    @Column("created_at")
    private Instant createdAt;

    @Column("updated_at")
    private Instant updatedAt;

    public ReturnEntity() {}

    public ReturnEntity(UUID id, String returnNumber, String type, UUID warehouseId,
                        UUID originalDocumentId, String status, String reason, String notes,
                        LocalDate returnDate, UUID createdBy, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.returnNumber = returnNumber;
        this.type = type;
        this.warehouseId = warehouseId;
        this.originalDocumentId = originalDocumentId;
        this.status = status;
        this.reason = reason;
        this.notes = notes;
        this.returnDate = returnDate;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters & Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getReturnNumber() { return returnNumber; }
    public void setReturnNumber(String returnNumber) { this.returnNumber = returnNumber; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public UUID getWarehouseId() { return warehouseId; }
    public void setWarehouseId(UUID warehouseId) { this.warehouseId = warehouseId; }
    public UUID getOriginalDocumentId() { return originalDocumentId; }
    public void setOriginalDocumentId(UUID originalDocumentId) { this.originalDocumentId = originalDocumentId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDate getReturnDate() { return returnDate; }
    public void setReturnDate(LocalDate returnDate) { this.returnDate = returnDate; }
    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
