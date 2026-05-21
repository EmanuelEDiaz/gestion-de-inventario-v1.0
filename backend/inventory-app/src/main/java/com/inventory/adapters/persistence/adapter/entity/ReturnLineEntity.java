package com.inventory.adapters.persistence.adapter.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Entidad R2DBC: Línea de devolución.
 */
@Table("return_lines")
public class ReturnLineEntity {

    @Id
    private UUID id;

    @Column("return_id")
    private UUID returnId;

    @Column("product_id")
    private UUID productId;

    @Column("quantity")
    private BigDecimal quantity;

    @Column("unit_price")
    private BigDecimal unitPrice;

    @Column("unit_cost")
    private BigDecimal unitCost;

    @Column("sort_order")
    private int sortOrder;

    public ReturnLineEntity() {}

    public ReturnLineEntity(UUID id, UUID returnId, UUID productId, BigDecimal quantity,
                            BigDecimal unitPrice, BigDecimal unitCost, int sortOrder) {
        this.id = id;
        this.returnId = returnId;
        this.productId = productId;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.unitCost = unitCost;
        this.sortOrder = sortOrder;
    }

    // Getters & Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getReturnId() { return returnId; }
    public void setReturnId(UUID returnId) { this.returnId = returnId; }
    public UUID getProductId() { return productId; }
    public void setProductId(UUID productId) { this.productId = productId; }
    public BigDecimal getQuantity() { return quantity; }
    public void setQuantity(BigDecimal quantity) { this.quantity = quantity; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public BigDecimal getUnitCost() { return unitCost; }
    public void setUnitCost(BigDecimal unitCost) { this.unitCost = unitCost; }
    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }
}
