package com.inventory.domain.model.purchase;
import com.inventory.domain.model.warehouse.Warehouse;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

/**
 * Entidad de dominio: Compra.
 * Representa una orden de compra con sus líneas de detalle.
 */
public class Purchase {
    private final UUID id;
    private final String purchaseNumber;
    private final UUID supplierId;
    private final UUID warehouseId;
    private final PurchaseStatus status;
    private final String currencyCode;
    private final BigDecimal exchangeRate;
    private final BigDecimal subtotal;
    private final BigDecimal taxAmount;
    private final BigDecimal total;
    private final String notes;
    private final LocalDate purchaseDate;
    private final LocalDate receivedDate;
    private final UUID createdBy;
    private final Instant createdAt;
    private final Instant updatedAt;
    private final int version;
    private final List<PurchaseLine> lines;

    public Purchase(UUID id, String purchaseNumber, UUID supplierId, UUID warehouseId,
                    PurchaseStatus status, String currencyCode, BigDecimal exchangeRate,
                    BigDecimal subtotal, BigDecimal taxAmount, BigDecimal total, String notes,
                    LocalDate purchaseDate, LocalDate receivedDate, UUID createdBy,
                    Instant createdAt, Instant updatedAt, int version, List<PurchaseLine> lines) {
        
        if (purchaseNumber == null || purchaseNumber.isBlank()) {
            throw new IllegalArgumentException("Purchase number is required");
        }
        if (warehouseId == null) {
            throw new IllegalArgumentException("Warehouse ID is required");
        }
        
        this.id = id != null ? id : UUID.randomUUID();
        this.purchaseNumber = purchaseNumber;
        this.supplierId = supplierId;
        this.warehouseId = warehouseId;
        this.status = status != null ? status : PurchaseStatus.DRAFT;
        this.currencyCode = currencyCode != null ? currencyCode : "CUP";
        this.exchangeRate = exchangeRate != null ? exchangeRate : BigDecimal.ONE;
        this.subtotal = subtotal != null ? subtotal : BigDecimal.ZERO;
        this.taxAmount = taxAmount != null ? taxAmount : BigDecimal.ZERO;
        this.total = total != null ? total : BigDecimal.ZERO;
        this.notes = notes;
        this.purchaseDate = purchaseDate != null ? purchaseDate : LocalDate.now();
        this.receivedDate = receivedDate;
        this.createdBy = createdBy;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
        this.version = version;
        this.lines = lines != null ? new ArrayList<>(lines) : new ArrayList<>();
    }

    // Factory methods

    public static Purchase create(String purchaseNumber, UUID warehouseId, UUID supplierId,
                                   UUID createdBy, List<PurchaseLine> lines) {
        BigDecimal subtotal = calculateSubtotal(lines);
        return new Purchase(null, purchaseNumber, supplierId, warehouseId,
                PurchaseStatus.DRAFT, "CUP", BigDecimal.ONE,
                subtotal, BigDecimal.ZERO, subtotal, null,
                LocalDate.now(), null, createdBy, null, null, 0, lines);
    }

    private static BigDecimal calculateSubtotal(List<PurchaseLine> lines) {
        if (lines == null) return BigDecimal.ZERO;
        return lines.stream()
                .map(PurchaseLine::getTotalCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // Getters
    public UUID getId() { return id; }
    public String getPurchaseNumber() { return purchaseNumber; }
    public UUID getSupplierId() { return supplierId; }
    public UUID getWarehouseId() { return warehouseId; }
    public PurchaseStatus getStatus() { return status; }
    public String getCurrencyCode() { return currencyCode; }
    public BigDecimal getExchangeRate() { return exchangeRate; }
    public BigDecimal getSubtotal() { return subtotal; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public BigDecimal getTotal() { return total; }
    public String getNotes() { return notes; }
    public LocalDate getPurchaseDate() { return purchaseDate; }
    public LocalDate getReceivedDate() { return receivedDate; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public int getVersion() { return version; }
    public List<PurchaseLine> getLines() { return Collections.unmodifiableList(lines); }

    // Business logic

    public boolean canConfirm() {
        return status == PurchaseStatus.DRAFT && !lines.isEmpty();
    }

    public boolean canReceive() {
        return status == PurchaseStatus.CONFIRMED;
    }

    public boolean canCancel() {
        return status == PurchaseStatus.DRAFT || status == PurchaseStatus.CONFIRMED;
    }

    public Purchase confirm() {
        if (!canConfirm()) {
            throw new IllegalStateException("Cannot confirm purchase in status: " + status);
        }
        return withStatus(PurchaseStatus.CONFIRMED);
    }

    public Purchase receive(LocalDate receivedDate) {
        if (!canReceive()) {
            throw new IllegalStateException("Cannot receive purchase in status: " + status);
        }
        return new Purchase(id, purchaseNumber, supplierId, warehouseId,
                PurchaseStatus.RECEIVED, currencyCode, exchangeRate,
                subtotal, taxAmount, total, notes, purchaseDate, receivedDate,
                createdBy, createdAt, Instant.now(), version, lines);
    }

    public Purchase cancel() {
        if (!canCancel()) {
            throw new IllegalStateException("Cannot cancel purchase in status: " + status);
        }
        return withStatus(PurchaseStatus.CANCELLED);
    }

    public Purchase withStatus(PurchaseStatus newStatus) {
        return new Purchase(id, purchaseNumber, supplierId, warehouseId,
                newStatus, currencyCode, exchangeRate, subtotal, taxAmount, total, notes,
                purchaseDate, receivedDate, createdBy, createdAt, Instant.now(), version, lines);
    }

    public Purchase addLine(PurchaseLine line) {
        List<PurchaseLine> newLines = new ArrayList<>(lines);
        newLines.add(line);
        BigDecimal newSubtotal = calculateSubtotal(newLines);
        return new Purchase(id, purchaseNumber, supplierId, warehouseId,
                status, currencyCode, exchangeRate, newSubtotal, taxAmount, 
                newSubtotal.add(taxAmount), notes, purchaseDate, receivedDate,
                createdBy, createdAt, Instant.now(), version, newLines);
    }

    public enum PurchaseStatus {
        DRAFT,
        CONFIRMED,
        RECEIVED,
        CANCELLED
    }
}
