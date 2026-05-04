package com.inventory.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Aggregate Root: Devolución.
 * Puede ser devolución de venta (cliente devuelve) o de compra (devolvemos a proveedor).
 * Inmutable - operaciones devuelven nuevas instancias.
 */
public class Return {
    private final UUID id;
    private final String returnNumber;
    private final ReturnType type;
    private final UUID warehouseId;
    private final UUID originalDocumentId;  // Sale ID o Purchase ID
    private final ReturnStatus status;
    private final String reason;
    private final String notes;
    private final LocalDate returnDate;
    private final UUID createdBy;
    private final Instant createdAt;
    private final Instant updatedAt;
    private final List<ReturnLine> lines;

    public enum ReturnType {
        SALE_RETURN,      // Cliente devuelve producto
        PURCHASE_RETURN   // Devolvemos a proveedor
    }

    public enum ReturnStatus {
        DRAFT,      // Borrador
        CONFIRMED,  // Confirmada, stock ajustado
        CANCELLED   // Cancelada
    }

    public Return(UUID id, String returnNumber, ReturnType type, UUID warehouseId,
                  UUID originalDocumentId, ReturnStatus status, String reason, String notes,
                  LocalDate returnDate, UUID createdBy, Instant createdAt, Instant updatedAt,
                  List<ReturnLine> lines) {
        this.id = id != null ? id : UUID.randomUUID();
        this.returnNumber = validateNumber(returnNumber);
        this.type = validateType(type);
        this.warehouseId = validateWarehouse(warehouseId);
        this.originalDocumentId = originalDocumentId;
        this.status = status != null ? status : ReturnStatus.DRAFT;
        this.reason = reason;
        this.notes = notes;
        this.returnDate = returnDate != null ? returnDate : LocalDate.now();
        this.createdBy = createdBy;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
        this.lines = lines != null ? new ArrayList<>(lines) : new ArrayList<>();
    }

    private String validateNumber(String number) {
        if (number == null || number.isBlank()) {
            throw new IllegalArgumentException("Return number is required");
        }
        return number;
    }

    private ReturnType validateType(ReturnType type) {
        if (type == null) {
            throw new IllegalArgumentException("Return type is required");
        }
        return type;
    }

    private UUID validateWarehouse(UUID warehouseId) {
        if (warehouseId == null) {
            throw new IllegalArgumentException("Warehouse is required");
        }
        return warehouseId;
    }

    // Factory
    public static Return create(String number, ReturnType type, UUID warehouseId,
                                 UUID originalDocumentId, String reason, UUID createdBy,
                                 List<ReturnLine> lines) {
        return new Return(null, number, type, warehouseId, originalDocumentId,
                ReturnStatus.DRAFT, reason, null, LocalDate.now(), createdBy, null, null, lines);
    }

    // Transiciones de estado
    public Return confirm() {
        if (status != ReturnStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT returns can be confirmed");
        }
        if (lines.isEmpty()) {
            throw new IllegalStateException("Cannot confirm return without lines");
        }
        return withStatus(ReturnStatus.CONFIRMED);
    }

    public Return cancel() {
        if (status != ReturnStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT returns can be cancelled");
        }
        return withStatus(ReturnStatus.CANCELLED);
    }

    private Return withStatus(ReturnStatus newStatus) {
        return new Return(id, returnNumber, type, warehouseId, originalDocumentId, newStatus,
                reason, notes, returnDate, createdBy, createdAt, Instant.now(), lines);
    }

    // Predicados
    public boolean canModify() { return status == ReturnStatus.DRAFT; }
    public boolean canDelete() { return status == ReturnStatus.DRAFT || status == ReturnStatus.CANCELLED; }
    public boolean canConfirm() { return status == ReturnStatus.DRAFT && !lines.isEmpty(); }
    public boolean isSaleReturn() { return type == ReturnType.SALE_RETURN; }
    public boolean isPurchaseReturn() { return type == ReturnType.PURCHASE_RETURN; }

    // Totales
    public BigDecimal getTotalAmount() {
        return lines.stream()
                .map(l -> l.getUnitPrice().multiply(l.getQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // Getters
    public UUID getId() { return id; }
    public String getReturnNumber() { return returnNumber; }
    public ReturnType getType() { return type; }
    public UUID getWarehouseId() { return warehouseId; }
    public UUID getOriginalDocumentId() { return originalDocumentId; }
    public ReturnStatus getStatus() { return status; }
    public String getReason() { return reason; }
    public String getNotes() { return notes; }
    public LocalDate getReturnDate() { return returnDate; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public List<ReturnLine> getLines() { return Collections.unmodifiableList(lines); }
}
