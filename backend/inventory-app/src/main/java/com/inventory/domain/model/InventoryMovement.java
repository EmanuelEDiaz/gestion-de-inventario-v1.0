package com.inventory.domain.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entidad de dominio: Movimiento de Inventario.
 * Representa una entrada inmutable en el ledger de inventario.
 * Una vez creado, un movimiento no puede ser modificado.
 */
public class InventoryMovement {
    private final UUID id;
    private final UUID warehouseId;
    private final UUID productId;
    private final MovementType movementType;
    private final BigDecimal quantity;
    private final BigDecimal unitCost;
    private final BigDecimal unitPrice;
    private final BigDecimal totalCost;
    private final BigDecimal totalPrice;
    private final String currencyCode;
    private final BigDecimal exchangeRate;
    private final BigDecimal balanceAfter;
    private final String sourceDocType;
    private final UUID sourceDocId;
    private final String notes;
    private final Instant occurredAt;
    private final UUID createdBy;
    private final Instant createdAt;

    public InventoryMovement(
            UUID id, UUID warehouseId, UUID productId, MovementType movementType,
            BigDecimal quantity, BigDecimal unitCost, BigDecimal unitPrice,
            BigDecimal totalCost, BigDecimal totalPrice, String currencyCode,
            BigDecimal exchangeRate, BigDecimal balanceAfter, String sourceDocType,
            UUID sourceDocId, String notes, Instant occurredAt, UUID createdBy, Instant createdAt) {
        
        if (warehouseId == null) throw new IllegalArgumentException("Warehouse ID is required");
        if (productId == null) throw new IllegalArgumentException("Product ID is required");
        if (movementType == null) throw new IllegalArgumentException("Movement type is required");
        if (quantity == null) throw new IllegalArgumentException("Quantity is required");
        if (sourceDocType == null) throw new IllegalArgumentException("Source document type is required");
        if (sourceDocId == null) throw new IllegalArgumentException("Source document ID is required");
        
        this.id = id != null ? id : UUID.randomUUID();
        this.warehouseId = warehouseId;
        this.productId = productId;
        this.movementType = movementType;
        this.quantity = quantity;
        this.unitCost = unitCost;
        this.unitPrice = unitPrice;
        this.totalCost = totalCost != null ? totalCost : (unitCost != null ? quantity.multiply(unitCost) : null);
        this.totalPrice = totalPrice != null ? totalPrice : (unitPrice != null ? quantity.multiply(unitPrice) : null);
        this.currencyCode = currencyCode != null ? currencyCode : "CUP";
        this.exchangeRate = exchangeRate != null ? exchangeRate : BigDecimal.ONE;
        this.balanceAfter = balanceAfter;
        this.sourceDocType = sourceDocType;
        this.sourceDocId = sourceDocId;
        this.notes = notes;
        this.occurredAt = occurredAt != null ? occurredAt : Instant.now();
        this.createdBy = createdBy;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    // Factory methods para diferentes tipos de movimientos

    public static InventoryMovement purchase(UUID warehouseId, UUID productId, BigDecimal quantity,
                                              BigDecimal unitCost, UUID purchaseId, BigDecimal balanceAfter,
                                              UUID createdBy) {
        return new InventoryMovement(
            null, warehouseId, productId, MovementType.PURCHASE,
            quantity, unitCost, null, null, null, "CUP", BigDecimal.ONE,
            balanceAfter, "PURCHASE", purchaseId, null, Instant.now(), createdBy, null
        );
    }

    public static InventoryMovement sale(UUID warehouseId, UUID productId, BigDecimal quantity,
                                          BigDecimal unitCost, BigDecimal unitPrice, UUID saleId,
                                          BigDecimal balanceAfter, UUID createdBy) {
        return new InventoryMovement(
            null, warehouseId, productId, MovementType.SALE,
            quantity.negate(), unitCost, unitPrice, null, null, "CUP", BigDecimal.ONE,
            balanceAfter, "SALE", saleId, null, Instant.now(), createdBy, null
        );
    }

    public static InventoryMovement saleReturn(UUID warehouseId, UUID productId, BigDecimal quantity,
                                                BigDecimal unitCost, BigDecimal unitPrice, UUID returnId,
                                                BigDecimal balanceAfter, UUID createdBy) {
        return new InventoryMovement(
            null, warehouseId, productId, MovementType.SALE_RETURN,
            quantity, unitCost, unitPrice, null, null, "CUP", BigDecimal.ONE,
            balanceAfter, "RETURN", returnId, null, Instant.now(), createdBy, null
        );
    }

    public static InventoryMovement purchaseReturn(UUID warehouseId, UUID productId, BigDecimal quantity,
                                                    BigDecimal unitCost, UUID returnId,
                                                    BigDecimal balanceAfter, UUID createdBy) {
        return new InventoryMovement(
            null, warehouseId, productId, MovementType.PURCHASE_RETURN,
            quantity.negate(), unitCost, null, null, null, "CUP", BigDecimal.ONE,
            balanceAfter, "RETURN", returnId, null, Instant.now(), createdBy, null
        );
    }

    public static InventoryMovement adjustment(UUID warehouseId, UUID productId, BigDecimal quantity,
                                                boolean isIncrease, UUID adjustmentId, BigDecimal balanceAfter,
                                                String notes, UUID createdBy) {
        MovementType type = isIncrease ? MovementType.ADJUSTMENT_IN : MovementType.ADJUSTMENT_OUT;
        BigDecimal qty = isIncrease ? quantity : quantity.negate();
        return new InventoryMovement(
            null, warehouseId, productId, type,
            qty, null, null, null, null, "CUP", BigDecimal.ONE,
            balanceAfter, "ADJUSTMENT", adjustmentId, notes, Instant.now(), createdBy, null
        );
    }

    public static InventoryMovement transferOut(UUID fromWarehouseId, UUID productId, BigDecimal quantity,
                                                 BigDecimal unitCost, UUID transferId, BigDecimal balanceAfter,
                                                 UUID createdBy) {
        return new InventoryMovement(
            null, fromWarehouseId, productId, MovementType.TRANSFER_OUT,
            quantity.negate(), unitCost, null, null, null, "CUP", BigDecimal.ONE,
            balanceAfter, "TRANSFER", transferId, null, Instant.now(), createdBy, null
        );
    }

    public static InventoryMovement transferIn(UUID toWarehouseId, UUID productId, BigDecimal quantity,
                                                BigDecimal unitCost, UUID transferId, BigDecimal balanceAfter,
                                                UUID createdBy) {
        return new InventoryMovement(
            null, toWarehouseId, productId, MovementType.TRANSFER_IN,
            quantity, unitCost, null, null, null, "CUP", BigDecimal.ONE,
            balanceAfter, "TRANSFER", transferId, null, Instant.now(), createdBy, null
        );
    }

    // Getters
    public UUID getId() { return id; }
    public UUID getWarehouseId() { return warehouseId; }
    public UUID getProductId() { return productId; }
    public MovementType getMovementType() { return movementType; }
    public BigDecimal getQuantity() { return quantity; }
    public BigDecimal getUnitCost() { return unitCost; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public BigDecimal getTotalCost() { return totalCost; }
    public BigDecimal getTotalPrice() { return totalPrice; }
    public String getCurrencyCode() { return currencyCode; }
    public BigDecimal getExchangeRate() { return exchangeRate; }
    public BigDecimal getBalanceAfter() { return balanceAfter; }
    public String getSourceDocType() { return sourceDocType; }
    public UUID getSourceDocId() { return sourceDocId; }
    public String getNotes() { return notes; }
    public Instant getOccurredAt() { return occurredAt; }
    public UUID getCreatedBy() { return createdBy; }
    public Instant getCreatedAt() { return createdAt; }

    /**
     * Determina si el movimiento suma o resta inventario.
     */
    public boolean isInbound() {
        return movementType.isInbound();
    }

    public enum MovementType {
        PURCHASE(true),
        SALE(false),
        SALE_RETURN(true),
        PURCHASE_RETURN(false),
        ADJUSTMENT_IN(true),
        ADJUSTMENT_OUT(false),
        TRANSFER_IN(true),
        TRANSFER_OUT(false),
        INITIAL(true);

        private final boolean inbound;

        MovementType(boolean inbound) {
            this.inbound = inbound;
        }

        public boolean isInbound() { return inbound; }
        public boolean isOutbound() { return !inbound; }
    }
}
