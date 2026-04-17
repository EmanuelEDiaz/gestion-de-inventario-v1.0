package com.inventory.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Aggregate Root: Sale
 * Represents a sale transaction that decreases inventory.
 */
public record Sale(
    UUID id,
    String saleNumber,
    UUID customerId,
    UUID warehouseId,
    SaleStatus status,
    String currencyCode,
    BigDecimal exchangeRate,
    BigDecimal subtotal,
    BigDecimal discountAmount,
    BigDecimal taxAmount,
    BigDecimal total,
    String notes,
    LocalDate saleDate,
    UUID createdBy,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<SaleLine> lines
) {
    public enum SaleStatus {
        DRAFT,
        CONFIRMED,
        DELIVERED,
        CANCELLED
    }

    public Sale {
        if (id == null) throw new IllegalArgumentException("Sale id cannot be null");
        if (saleNumber == null || saleNumber.isBlank()) throw new IllegalArgumentException("Sale number cannot be blank");
        if (warehouseId == null) throw new IllegalArgumentException("Warehouse id cannot be null");
        if (status == null) throw new IllegalArgumentException("Status cannot be null");
        if (currencyCode == null) currencyCode = "USD";
        if (exchangeRate == null) exchangeRate = BigDecimal.ONE;
        if (subtotal == null) subtotal = BigDecimal.ZERO;
        if (discountAmount == null) discountAmount = BigDecimal.ZERO;
        if (taxAmount == null) taxAmount = BigDecimal.ZERO;
        if (total == null) total = BigDecimal.ZERO;
        if (saleDate == null) saleDate = LocalDate.now();
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = createdAt;
        if (lines == null) lines = List.of();
    }

    public static Sale createDraft(
        String saleNumber,
        UUID warehouseId,
        UUID customerId,
        String currencyCode,
        String notes,
        LocalDate saleDate,
        List<SaleLine> lines,
        UUID createdBy
    ) {
        BigDecimal subtotal = calculateSubtotal(lines);
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal taxAmount = BigDecimal.ZERO;
        BigDecimal total = subtotal.subtract(discountAmount).add(taxAmount);
        
        return new Sale(
            UUID.randomUUID(),
            saleNumber,
            customerId,
            warehouseId,
            SaleStatus.DRAFT,
            currencyCode != null ? currencyCode : "USD",
            BigDecimal.ONE,
            subtotal,
            discountAmount,
            taxAmount,
            total,
            notes,
            saleDate != null ? saleDate : LocalDate.now(),
            createdBy,
            LocalDateTime.now(),
            LocalDateTime.now(),
            lines
        );
    }

    private static BigDecimal calculateSubtotal(List<SaleLine> lines) {
        return lines.stream()
            .map(SaleLine::totalPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public Sale confirm() {
        if (status != SaleStatus.DRAFT) {
            throw new IllegalStateException("Only DRAFT sales can be confirmed");
        }
        if (lines.isEmpty()) {
            throw new IllegalStateException("Cannot confirm sale without lines");
        }
        return new Sale(
            id, saleNumber, customerId, warehouseId,
            SaleStatus.CONFIRMED,
            currencyCode, exchangeRate, subtotal, discountAmount, taxAmount, total,
            notes, saleDate, createdBy, createdAt, LocalDateTime.now(), lines
        );
    }

    public Sale deliver() {
        if (status != SaleStatus.CONFIRMED) {
            throw new IllegalStateException("Only CONFIRMED sales can be delivered");
        }
        return new Sale(
            id, saleNumber, customerId, warehouseId,
            SaleStatus.DELIVERED,
            currencyCode, exchangeRate, subtotal, discountAmount, taxAmount, total,
            notes, saleDate, createdBy, createdAt, LocalDateTime.now(), lines
        );
    }

    public Sale cancel() {
        if (status == SaleStatus.DELIVERED) {
            throw new IllegalStateException("Cannot cancel a delivered sale");
        }
        if (status == SaleStatus.CANCELLED) {
            throw new IllegalStateException("Sale is already cancelled");
        }
        return new Sale(
            id, saleNumber, customerId, warehouseId,
            SaleStatus.CANCELLED,
            currencyCode, exchangeRate, subtotal, discountAmount, taxAmount, total,
            notes, saleDate, createdBy, createdAt, LocalDateTime.now(), lines
        );
    }

    public boolean canModify() {
        return status == SaleStatus.DRAFT;
    }

    public boolean canDelete() {
        return status == SaleStatus.DRAFT || status == SaleStatus.CANCELLED;
    }
}
