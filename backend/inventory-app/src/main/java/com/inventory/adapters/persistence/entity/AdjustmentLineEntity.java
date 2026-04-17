package com.inventory.adapters.persistence.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Entidad R2DBC: Línea de ajuste.
 */
@Table("adjustment_lines")
public class AdjustmentLineEntity {

    @Id
    private UUID id;

    @Column("adjustment_id")
    private UUID adjustmentId;

    @Column("product_id")
    private UUID productId;

    @Column("system_qty")
    private BigDecimal systemQty;

    @Column("counted_qty")
    private BigDecimal countedQty;

    @Column("difference")
    private BigDecimal difference;

    @Column("unit_cost")
    private BigDecimal unitCost;

    @Column("sort_order")
    private int sortOrder;

    public AdjustmentLineEntity() {}

    public AdjustmentLineEntity(UUID id, UUID adjustmentId, UUID productId, BigDecimal systemQty,
                                 BigDecimal countedQty, BigDecimal difference, BigDecimal unitCost, int sortOrder) {
        this.id = id;
        this.adjustmentId = adjustmentId;
        this.productId = productId;
        this.systemQty = systemQty;
        this.countedQty = countedQty;
        this.difference = difference;
        this.unitCost = unitCost;
        this.sortOrder = sortOrder;
    }

    // Getters & Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getAdjustmentId() { return adjustmentId; }
    public void setAdjustmentId(UUID adjustmentId) { this.adjustmentId = adjustmentId; }
    public UUID getProductId() { return productId; }
    public void setProductId(UUID productId) { this.productId = productId; }
    public BigDecimal getSystemQty() { return systemQty; }
    public void setSystemQty(BigDecimal systemQty) { this.systemQty = systemQty; }
    public BigDecimal getCountedQty() { return countedQty; }
    public void setCountedQty(BigDecimal countedQty) { this.countedQty = countedQty; }
    public BigDecimal getDifference() { return difference; }
    public void setDifference(BigDecimal difference) { this.difference = difference; }
    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
