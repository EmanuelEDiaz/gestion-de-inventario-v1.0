package com.inventory.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Aggregate Root: Transferencia entre almacenes.
 * Inmutable - operaciones devuelven nuevas instancias.
 */
public class Transfer {
    private final UUID id;
    private final String transferNumber;
    private final UUID fromWarehouseId;
    private final UUID toWarehouseId;
    private final TransferStatus status;
    private final String notes;
    private final LocalDate transferDate;
    private final LocalDate receivedDate;
    private final UUID createdBy;
    private final Instant createdAt;
    private final Instant updatedAt;
    private final List<TransferLine> lines;

    public enum TransferStatus {
        DRAFT,      // Borrador, editable
        CONFIRMED,  // Confirmada, stock reservado en origen
        IN_TRANSIT, // En tránsito
        COMPLETED,  // Completada, stock actualizado
        CANCELLED   // Cancelada
    }

    public Transfer(UUID id, String transferNumber, UUID fromWarehouseId, UUID toWarehouseId,
                    TransferStatus status, String notes, LocalDate transferDate, LocalDate receivedDate,
                    UUID createdBy, Instant createdAt, Instant updatedAt, List<TransferLine> lines) {
        this.id = id != null ? id : UUID.randomUUID();
        this.transferNumber = validateNumber(transferNumber);
        this.fromWarehouseId = validateWarehouse(fromWarehouseId, "Origin");
        this.toWarehouseId = validateWarehouse(toWarehouseId, "Destination");
        validateDifferentWarehouses(fromWarehouseId, toWarehouseId);
        this.status = status != null ? status : TransferStatus.DRAFT;
        this.notes = notes;
        this.transferDate = transferDate != null ? transferDate : LocalDate.now();
        this.receivedDate = receivedDate;
        this.createdBy = createdBy;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
        this.lines = lines != null ? new ArrayList<>(lines) : new ArrayList<>();
    }

    // Validaciones como métodos privados (clean-code: SRP)
    private String validateNumber(String number) {
        if (number == null || number.isBlank()) {
            throw new IllegalArgumentException("Transfer number is required");
        }
        return number;
    }

    private UUID validateWarehouse(UUID warehouseId, String type) {
        if (warehouseId == null) {
            throw new IllegalArgumentException(type + " warehouse is required");
        }
        return warehouseId;
    }

    private void validateDifferentWarehouses(UUID from, UUID to) {
        if (from.equals(to)) {
            throw new IllegalArgumentException("Origin and destination warehouses must be different");
        }
    }

    // Factory method (clean-code: constructor simple, factory para lógica)
    public static Transfer create(String number, UUID from, UUID to, UUID createdBy, List<TransferLine> lines) {
        return new Transfer(null, number, from, to, TransferStatus.DRAFT, null,
                LocalDate.now(), null, createdBy, null, null, lines);
    }

    // Transiciones de estado (clean-code: guard clause + single responsibility)
    public Transfer confirm() {
        if (status != TransferStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT transfers can be confirmed");
        }
        if (lines.isEmpty()) {
            throw new IllegalStateException("Cannot confirm transfer without lines");
        }
        return withStatus(TransferStatus.CONFIRMED);
    }

    public Transfer ship() {
        if (status != TransferStatus.CONFIRMED) {
            throw new IllegalStateException("Only CONFIRMED transfers can be shipped");
        }
        return withStatus(TransferStatus.IN_TRANSIT);
    }

    public Transfer complete(LocalDate receivedDate) {
        if (status != TransferStatus.IN_TRANSIT) {
            throw new IllegalStateException("Only IN_TRANSIT transfers can be completed");
        }
        return new Transfer(id, transferNumber, fromWarehouseId, toWarehouseId,
                TransferStatus.COMPLETED, notes, transferDate,
                receivedDate != null ? receivedDate : LocalDate.now(),
                createdBy, createdAt, Instant.now(), lines);
    }

    public Transfer cancel() {
        if (status == TransferStatus.COMPLETED) {
            throw new IllegalStateException("Cannot cancel completed transfer");
        }
        if (status == TransferStatus.CANCELLED) {
            throw new IllegalStateException("Transfer already cancelled");
        }
        return withStatus(TransferStatus.CANCELLED);
    }

    private Transfer withStatus(TransferStatus newStatus) {
        return new Transfer(id, transferNumber, fromWarehouseId, toWarehouseId,
                newStatus, notes, transferDate, receivedDate, createdBy,
                createdAt, Instant.now(), lines);
    }

    // Predicados (clean-code: booleans como pregunta)
    public boolean canModify() { return status == TransferStatus.DRAFT; }
    public boolean canDelete() { return status == TransferStatus.DRAFT || status == TransferStatus.CANCELLED; }
    public boolean canConfirm() { return status == TransferStatus.DRAFT && !lines.isEmpty(); }
    public boolean canShip() { return status == TransferStatus.CONFIRMED; }
    public boolean canComplete() { return status == TransferStatus.IN_TRANSIT; }

    // Getters (no setters - inmutable)
    public UUID getId() { return id; }
    public String getTransferNumber() { return transferNumber; }
    public UUID getFromWarehouseId() { return fromWarehouseId; }
    public UUID getToWarehouseId() { return toWarehouseId; }
    public TransferStatus getStatus() { return status; }
    public String getNotes() { return notes; }
    public LocalDate getTransferDate() { return transferDate; }
    public LocalDate getReceivedDate() { return receivedDate; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public List<TransferLine> getLines() { return Collections.unmodifiableList(lines); }
}
