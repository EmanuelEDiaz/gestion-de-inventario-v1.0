package com.inventory.domain.model;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Value Object: Línea de ajuste.
 * Contiene la diferencia de cantidad (positiva = entrada, negativa = salida).
 * Inmutable.
 */
public class AdjustmentLine {
    private final UUID id;
    private final UUID productId;
    private final BigDecimal systemQty;     // Cantidad en sistema antes del ajuste
    private final BigDecimal countedQty;    // Cantidad contada/real
    private final BigDecimal difference;    // countedQty - systemQty
    private final BigDecimal unitCost;
    private final int sortOrder;

    public AdjustmentLine(UUID id, UUID productId, BigDecimal systemQty, BigDecimal countedQty,
                          BigDecimal unitCost, int sortOrder) {
        this.id = id != null ? id : UUID.randomUUID();
        this.productId = validateProductId(productId);
        this.systemQty = systemQty != null ? systemQty : BigDecimal.ZERO;
        this.countedQty = validateCountedQty(countedQty);
        this.difference = this.countedQty.subtract(this.systemQty);
        this.unitCost = unitCost;
        this.sortOrder = sortOrder;
    }

    private UUID validateProductId(UUID productId) {
        if (productId == null) {
            throw new IllegalArgumentException("Product ID is required");
        }
        return productId;
    }

    private BigDecimal validateCountedQty(BigDecimal qty) {
        if (qty == null || qty.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Counted quantity cannot be negative");
        }
        return qty;
    }

    // Factory
    public static AdjustmentLine create(UUID productId, BigDecimal systemQty, BigDecimal countedQty,
                                         BigDecimal unitCost, int sortOrder) {
        return new AdjustmentLine(null, productId, systemQty, countedQty, unitCost, sortOrder);
    }

    public boolean isIncrease() { return difference.compareTo(BigDecimal.ZERO) > 0; }
    public boolean isDecrease() { return difference.compareTo(BigDecimal.ZERO) < 0; }
    public boolean isZero() { return difference.compareTo(BigDecimal.ZERO) == 0; }

    // Getters
    public UUID getId() { return id; }
    public UUID getProductId() { return productId; }
    public BigDecimal getSystemQty() { return systemQty; }
    public BigDecimal getCountedQty() { return countedQty; }
    public BigDecimal getDifference() { return difference; }
    public BigDecimal getUnitCost() { return unitCost; }
    public int getSortOrder() { return sortOrder; }
}
