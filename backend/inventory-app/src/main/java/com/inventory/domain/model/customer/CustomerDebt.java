package com.inventory.domain.model.customer;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entidad de dominio: Deuda de cliente.
 * Representa el saldo pendiente de una venta en modo fiado (CREDIT).
 * Máquina de estados: PENDING → PARTIAL → PAID / CANCELLED
 */
public class CustomerDebt {

    public enum DebtStatus {
        PENDING, PARTIAL, PAID, CANCELLED
    }

    private final UUID id;
    private final UUID customerId;
    private final UUID saleId;
    private final BigDecimal originalAmount;
    private final BigDecimal paidAmount;
    private final String currencyCode;
    private final DebtStatus status;
    private final String description;
    private final Instant dueDate;
    private final String notes;
    private final Instant createdAt;
    private final Instant updatedAt;
    private final long version;

    public CustomerDebt(UUID id, UUID customerId, UUID saleId,
                        BigDecimal originalAmount, BigDecimal paidAmount,
                        String currencyCode, DebtStatus status,
                        String description, Instant dueDate, String notes,
                        Instant createdAt, Instant updatedAt, long version) {
        if (customerId == null) throw new IllegalArgumentException("customerId cannot be null");
        if (saleId == null) throw new IllegalArgumentException("saleId cannot be null");
        if (originalAmount == null || originalAmount.compareTo(BigDecimal.ZERO) < 0)
            throw new IllegalArgumentException("originalAmount must be non-negative");
        if (currencyCode == null || currencyCode.isBlank())
            throw new IllegalArgumentException("currencyCode cannot be blank");
        if (status == null) throw new IllegalArgumentException("status cannot be null");
        this.id = id != null ? id : UUID.randomUUID();
        this.customerId = customerId;
        this.saleId = saleId;
        this.originalAmount = originalAmount;
        this.paidAmount = paidAmount != null ? paidAmount : BigDecimal.ZERO;
        this.currencyCode = currencyCode;
        this.status = status;
        this.description = description;
        this.dueDate = dueDate;
        this.notes = notes;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
        this.updatedAt = updatedAt != null ? updatedAt : this.createdAt;
        this.version = version;
    }

    public static CustomerDebt create(UUID customerId, UUID saleId,
                                      BigDecimal originalAmount, String currencyCode) {
        return new CustomerDebt(UUID.randomUUID(), customerId, saleId,
                                originalAmount, BigDecimal.ZERO, currencyCode,
                                DebtStatus.PENDING, null, null, null,
                                Instant.now(), Instant.now(), 0L);
    }

    /**
     * Registra un pago parcial o total.
     * Recalcula el estado automáticamente.
     */
    public CustomerDebt registerPayment(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("payment amount must be positive");
        if (status == DebtStatus.CANCELLED)
            throw new IllegalStateException("Cannot pay a cancelled debt");
        if (status == DebtStatus.PAID)
            throw new IllegalStateException("Debt is already fully paid");

        BigDecimal newPaid = this.paidAmount.add(amount);
        DebtStatus newStatus = newPaid.compareTo(this.originalAmount) >= 0
                ? DebtStatus.PAID
                : DebtStatus.PARTIAL;

        return new CustomerDebt(id, customerId, saleId, originalAmount, newPaid,
                                currencyCode, newStatus, description, dueDate, notes,
                                createdAt, Instant.now(), version);
    }

    public CustomerDebt update(String description, Instant dueDate, String notes) {
        return new CustomerDebt(id, customerId, saleId, originalAmount, paidAmount,
                                currencyCode, status, description, dueDate, notes,
                                createdAt, Instant.now(), version);
    }

    public CustomerDebt cancel() {
        if (status == DebtStatus.PAID)
            throw new IllegalStateException("Cannot cancel a paid debt");
        return new CustomerDebt(id, customerId, saleId, originalAmount, paidAmount,
                                currencyCode, DebtStatus.CANCELLED, description, dueDate, notes,
                                createdAt, Instant.now(), version);
    }

    public CustomerDebt withVersion(long newVersion) {
        return new CustomerDebt(id, customerId, saleId, originalAmount, paidAmount,
                                currencyCode, status, description, dueDate, notes,
                                createdAt, updatedAt, newVersion);
    }

    // Getters
    public UUID getId() { return id; }
    public UUID getCustomerId() { return customerId; }
    public UUID getSaleId() { return saleId; }
    public BigDecimal getOriginalAmount() { return originalAmount; }
    public BigDecimal getPaidAmount() { return paidAmount; }
    public String getCurrencyCode() { return currencyCode; }
    public DebtStatus getStatus() { return status; }
    public String getDescription() { return description; }
    public Instant getDueDate() { return dueDate; }
    public String getNotes() { return notes; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public long getVersion() { return version; }
}
