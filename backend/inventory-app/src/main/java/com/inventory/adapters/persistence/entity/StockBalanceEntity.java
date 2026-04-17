package com.inventory.adapters.persistence.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entidad R2DBC para la tabla stock_balances.
 * Clave primaria compuesta: (warehouse_id, product_id)
 */
@Table("stock_balances")
public class StockBalanceEntity {

    @Column("warehouse_id")
    private UUID warehouseId;

    @Column("product_id")
    private UUID productId;

    @Column("on_hand")
    private BigDecimal onHand;

    @Column("reserved")
    private BigDecimal reserved;

    @Column("avg_cost")
    private BigDecimal avgCost;

    @Column("updated_at")
    private Instant updatedAt;

    public StockBalanceEntity() {}

    public StockBalanceEntity(UUID warehouseId, UUID productId, BigDecimal onHand, 
                               BigDecimal reserved, BigDecimal avgCost, Instant updatedAt) {
        this.warehouseId = warehouseId;
        this.productId = productId;
        this.onHand = onHand;
        this.reserved = reserved;
        this.avgCost = avgCost;
        this.updatedAt = updatedAt;
    }

    // Getters y Setters
    public UUID getWarehouseId() { return warehouseId; }
    public void setWarehouseId(UUID warehouseId) { this.warehouseId = warehouseId; }

    public UUID getProductId() { return productId; }
    public void setProductId(UUID productId) { this.productId = productId; }

    public BigDecimal getOnHand() { return onHand; }
    public void setOnHand(BigDecimal onHand) { this.onHand = onHand; }

    public BigDecimal getReserved() { return reserved; }
    public void setReserved(BigDecimal reserved) { this.reserved = reserved; }

    public BigDecimal getAvgCost() { return avgCost; }
    public void setAvgCost(BigDecimal avgCost) { this.avgCost = avgCost; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
