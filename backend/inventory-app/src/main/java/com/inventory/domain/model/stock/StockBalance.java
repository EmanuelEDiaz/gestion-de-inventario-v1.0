package com.inventory.domain.model.stock;
import com.inventory.domain.model.warehouse.Warehouse;
import com.inventory.domain.model.product.Product;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Value Object de dominio: Balance de Stock.
 * Representa el estado actual del inventario de un producto en un almacén.
 * Es calculado a partir del ledger de movimientos.
 */
public class StockBalance {
    private final UUID warehouseId;
    private final UUID productId;
    private final BigDecimal onHand;
    private final BigDecimal reserved;
    private final BigDecimal avgCost;
    private final Instant updatedAt;

    public StockBalance(UUID warehouseId, UUID productId, BigDecimal onHand, 
                        BigDecimal reserved, BigDecimal avgCost, Instant updatedAt) {
        if (warehouseId == null) {
            throw new IllegalArgumentException("Warehouse ID cannot be null");
        }
        if (productId == null) {
            throw new IllegalArgumentException("Product ID cannot be null");
        }
        this.warehouseId = warehouseId;
        this.productId = productId;
        this.onHand = onHand != null ? onHand : BigDecimal.ZERO;
        this.reserved = reserved != null ? reserved : BigDecimal.ZERO;
        this.avgCost = avgCost;
        this.updatedAt = updatedAt != null ? updatedAt : Instant.now();
    }

    public static StockBalance empty(UUID warehouseId, UUID productId) {
        return new StockBalance(warehouseId, productId, BigDecimal.ZERO, BigDecimal.ZERO, null, Instant.now());
    }

    // Getters
    public UUID getWarehouseId() { return warehouseId; }
    public UUID getProductId() { return productId; }
    public BigDecimal getOnHand() { return onHand; }
    public BigDecimal getReserved() { return reserved; }
    public BigDecimal getAvgCost() { return avgCost; }
    public Instant getUpdatedAt() { return updatedAt; }

    /**
     * Calcula la cantidad disponible (on_hand - reserved).
     */
    public BigDecimal getAvailable() {
        return onHand.subtract(reserved);
    }

    /**
     * Calcula el valor total del inventario (on_hand * avg_cost).
     */
    public BigDecimal getTotalValue() {
        if (avgCost == null) return null;
        return onHand.multiply(avgCost);
    }

    /**
     * Verifica si hay suficiente stock disponible.
     */
    public boolean hasAvailable(BigDecimal quantity) {
        return getAvailable().compareTo(quantity) >= 0;
    }

    /**
     * Verifica si el stock está por debajo del punto de reorden.
     */
    public boolean isBelowReorderPoint(BigDecimal reorderPoint) {
        if (reorderPoint == null) return false;
        return onHand.compareTo(reorderPoint) < 0;
    }

    // Operaciones inmutables

    public StockBalance addStock(BigDecimal quantity, BigDecimal unitCost) {
        BigDecimal newOnHand = this.onHand.add(quantity);
        BigDecimal newAvgCost = calculateNewAvgCost(quantity, unitCost);
        return new StockBalance(warehouseId, productId, newOnHand, reserved, newAvgCost, Instant.now());
    }

    public StockBalance removeStock(BigDecimal quantity) {
        BigDecimal newOnHand = this.onHand.subtract(quantity);
        return new StockBalance(warehouseId, productId, newOnHand, reserved, avgCost, Instant.now());
    }

    public StockBalance reserve(BigDecimal quantity) {
        BigDecimal newReserved = this.reserved.add(quantity);
        return new StockBalance(warehouseId, productId, onHand, newReserved, avgCost, Instant.now());
    }

    public StockBalance unreserve(BigDecimal quantity) {
        BigDecimal newReserved = this.reserved.subtract(quantity);
        return new StockBalance(warehouseId, productId, onHand, newReserved, avgCost, Instant.now());
    }

    private BigDecimal calculateNewAvgCost(BigDecimal addedQty, BigDecimal addedCost) {
        if (addedCost == null) return this.avgCost;
        if (this.avgCost == null || this.onHand.compareTo(BigDecimal.ZERO) == 0) {
            return addedCost;
        }
        // WAC = (existingValue + newValue) / (existingQty + newQty)
        BigDecimal existingValue = this.onHand.multiply(this.avgCost);
        BigDecimal newValue = addedQty.multiply(addedCost);
        BigDecimal totalQty = this.onHand.add(addedQty);
        return existingValue.add(newValue).divide(totalQty, 4, java.math.RoundingMode.HALF_UP);
    }
}
