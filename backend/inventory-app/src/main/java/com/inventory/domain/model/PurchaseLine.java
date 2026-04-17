package com.inventory.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Value Object de dominio: Línea de Compra.
 * Representa un ítem dentro de una orden de compra.
 */
public class PurchaseLine {
    private final UUID id;
    private final UUID purchaseId;
    private final UUID productId;
    private final BigDecimal quantity;
    private final BigDecimal unitCost;
    private final BigDecimal totalCost;
    private final BigDecimal receivedQty;
    private final int sortOrder;
    private final Instant createdAt;

    public PurchaseLine(UUID id, UUID purchaseId, UUID productId, BigDecimal quantity,
                        BigDecimal unitCost, BigDecimal totalCost, BigDecimal receivedQty,
                        int sortOrder, Instant createdAt) {
        
        if (productId == null) {
            throw new IllegalArgumentException("Product ID is required");
        }
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        if (unitCost == null || unitCost.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Unit cost cannot be negative");
        }
        
        this.id = id != null ? id : UUID.randomUUID();
        this.purchaseId = purchaseId;
        this.productId = productId;
        this.quantity = quantity;
        this.unitCost = unitCost;
        this.totalCost = totalCost != null ? totalCost : quantity.multiply(unitCost);
        this.receivedQty = receivedQty != null ? receivedQty : BigDecimal.ZERO;
        this.sortOrder = sortOrder;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public static PurchaseLine create(UUID productId, BigDecimal quantity, BigDecimal unitCost, int sortOrder) {
        return new PurchaseLine(null, null, productId, quantity, unitCost, null, null, sortOrder, null);
    }

    public PurchaseLine withPurchaseId(UUID purchaseId) {
        return new PurchaseLine(id, purchaseId, productId, quantity, unitCost, totalCost, receivedQty, sortOrder, createdAt);
    }

    public PurchaseLine receive(BigDecimal qty) {
        BigDecimal newReceivedQty = this.receivedQty.add(qty);
        if (newReceivedQty.compareTo(quantity) > 0) {
            throw new IllegalArgumentException("Cannot receive more than ordered quantity");
        }
        return new PurchaseLine(id, purchaseId, productId, quantity, unitCost, totalCost, newReceivedQty, sortOrder, createdAt);
    }

    // Getters
    public UUID getId() { return id; }
    public UUID getPurchaseId() { return purchaseId; }
    public UUID getProductId() { return productId; }
    public BigDecimal getQuantity() { return quantity; }
    public BigDecimal getUnitCost() { return unitCost; }
    public BigDecimal getTotalCost() { return totalCost; }
    public BigDecimal getReceivedQty() { return receivedQty; }
    public int getSortOrder() { return sortOrder; }
    public Instant getCreatedAt() { return createdAt; }

    public BigDecimal getPendingQty() {
        return quantity.subtract(receivedQty);
    }

    public boolean isFullyReceived() {
        return receivedQty.compareTo(quantity) >= 0;
    }
}
