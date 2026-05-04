package com.inventory.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Aggregate Root: Ajuste de Inventario.
 * Representa una corrección de stock por conteo físico, daños, etc.
 * Inmutable - operaciones devuelven nuevas instancias.
 */
public class Adjustment {
    private final UUID id;
    private final String adjustmentNumber;
    private final UUID warehouseId;
    private final AdjustmentType type;
    private final AdjustmentStatus status;
    private final String reason;
    private final String notes;
    private final LocalDate adjustmentDate;
    private final UUID createdBy;
    private final Instant createdAt;
    private final Instant updatedAt;
    private final List<AdjustmentLine> lines;

    public enum AdjustmentType {
        COUNT,      // Conteo físico
        DAMAGE,     // Daños
        THEFT,      // Robo/pérdida
        EXPIRY,     // Vencimiento
        OTHER       // Otro
    }

    public enum AdjustmentStatus {
        DRAFT,      // Borrador, editable
        CONFIRMED,  // Confirmada, stock ajustado
        CANCELLED   // Cancelada
    }

    public Adjustment(UUID id, String adjustmentNumber, UUID warehouseId, AdjustmentType type,
                      AdjustmentStatus status, String reason, String notes, LocalDate adjustmentDate,
                      UUID createdBy, Instant createdAt, Instant updatedAt, List<AdjustmentLine> lines) {
        this.id = id != null ? id : UUID.randomUUID();
        this.adjustmentNumber = validateNumber(adjustmentNumber);
        this.warehouseId = validateWarehouse(warehouseId);
        this.type = type != null ? type : AdjustmentType.COUNT;
        this.status = status != null ? status : AdjustmentStatus.DRAFT;
        this.reason = reason;
        this.notes = notes;
        this.adjustmentDate = adjustmentDate != null ? adjustmentDate : LocalDate.now();
        this.createdBy = createdBy;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
        this.lines = lines != null ? new ArrayList<>(lines) : new ArrayList<>();
    }

    private String validateNumber(String number) {
        if (number == null || number.isBlank()) {
            throw new IllegalArgumentException("Adjustment number is required");
        }
        return number;
    }

    private UUID validateWarehouse(UUID warehouseId) {
        if (warehouseId == null) {
            throw new IllegalArgumentException("Warehouse is required");
        }
        return warehouseId;
    }

    // Factory
    public static Adjustment create(String number, UUID warehouseId, AdjustmentType type,
                                     String reason, UUID createdBy, List<AdjustmentLine> lines) {
        return new Adjustment(null, number, warehouseId, type, AdjustmentStatus.DRAFT,
                reason, null, LocalDate.now(), createdBy, null, null, lines);
    }

    // Transiciones de estado
    public Adjustment confirm() {
        if (status != AdjustmentStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT adjustments can be confirmed");
        }
        if (lines.isEmpty()) {
            throw new IllegalStateException("Cannot confirm adjustment without lines");
        }
        return withStatus(AdjustmentStatus.CONFIRMED);
    }

    public Adjustment cancel() {
        if (status != AdjustmentStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT adjustments can be cancelled");
        }
        return withStatus(AdjustmentStatus.CANCELLED);
    }

    private Adjustment withStatus(AdjustmentStatus newStatus) {
        return new Adjustment(id, adjustmentNumber, warehouseId, type, newStatus,
                reason, notes, adjustmentDate, createdBy, createdAt, Instant.now(), lines);
    }

    // Predicados
    public boolean canModify() { return status == AdjustmentStatus.DRAFT; }
    public boolean canDelete() { return status == AdjustmentStatus.DRAFT || status == AdjustmentStatus.CANCELLED; }
    public boolean canConfirm() { return status == AdjustmentStatus.DRAFT && !lines.isEmpty(); }

    // Getters
    public UUID getId() { return id; }
    public String getAdjustmentNumber() { return adjustmentNumber; }
    public UUID getWarehouseId() { return warehouseId; }
    public AdjustmentType getType() { return type; }
    public AdjustmentStatus getStatus() { return status; }
    public String getReason() { return reason; }
    public String getNotes() { return notes; }
    public LocalDate getAdjustmentDate() { return adjustmentDate; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public List<AdjustmentLine> getLines() { return Collections.unmodifiableList(lines); }
}
