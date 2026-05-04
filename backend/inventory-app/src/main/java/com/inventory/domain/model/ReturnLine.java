package com.inventory.domain.model;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Value Object: Línea de devolución.
 * Inmutable.
 */
public class ReturnLine {
    private final UUID id;
    private final UUID productId;
    private final BigDecimal quantity;
    private final BigDecimal unitPrice;
    private final BigDecimal unitCost;
    private final int sortOrder;

    public ReturnLine(UUID id, UUID productId, BigDecimal quantity, BigDecimal unitPrice,
                      BigDecimal unitCost, int sortOrder) {
        this.id = id != null ? id : UUID.randomUUID();
        this.productId = validateProductId(productId);
        this.quantity = validateQuantity(quantity);
        this.unitPrice = unitPrice != null ? unitPrice : BigDecimal.ZERO;
        this.unitCost = unitCost;
        this.sortOrder = sortOrder;
    }

    private UUID validateProductId(UUID productId) {
        if (productId == null) {
            throw new IllegalArgumentException("Product ID is required");
        }
        return productId;
    }

    private BigDecimal validateQuantity(BigDecimal qty) {
        if (qty == null || qty.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }
        return qty;
    }

    // Factory
    public static ReturnLine create(UUID productId, BigDecimal quantity, BigDecimal unitPrice,
                                     BigDecimal unitCost, int sortOrder) {
        return new ReturnLine(null, productId, quantity, unitPrice, unitCost, sortOrder);
    }

    public BigDecimal getSubtotal() {
        return unitPrice.multiply(quantity);
    }

    // Getters
    public UUID getId() { return id; }
    public UUID getProductId() { return productId; }
    public BigDecimal getQuantity() { return quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public BigDecimal getUnitCost() { return unitCost; }
    public int getSortOrder() { return sortOrder; }
}
