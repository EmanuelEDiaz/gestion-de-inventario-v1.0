package com.inventory.domain.model.transfer;
import com.inventory.domain.model.product.Product;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Value Object: Línea de transferencia.
 * Inmutable - representa un producto a transferir.
 */
public class TransferLine {
    private final UUID id;
    private final UUID productId;
    private final BigDecimal quantity;
    private final BigDecimal receivedQty;
    private final int sortOrder;

    public TransferLine(UUID id, UUID productId, BigDecimal quantity, BigDecimal receivedQty, int sortOrder) {
        this.id = id != null ? id : UUID.randomUUID();
        this.productId = validateProductId(productId);
        this.quantity = validateQuantity(quantity);
        this.receivedQty = receivedQty != null ? receivedQty : BigDecimal.ZERO;
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

    // Factory method
    public static TransferLine create(UUID productId, BigDecimal quantity, int sortOrder) {
        return new TransferLine(null, productId, quantity, BigDecimal.ZERO, sortOrder);
    }

    // Operación de recepción
    public TransferLine receive(BigDecimal qty) {
        return new TransferLine(id, productId, quantity, qty, sortOrder);
    }

    public boolean isFullyReceived() {
        return receivedQty.compareTo(quantity) >= 0;
    }

    // Getters
    public UUID getId() { return id; }
    public UUID getProductId() { return productId; }
    public BigDecimal getQuantity() { return quantity; }
    public BigDecimal getReceivedQty() { return receivedQty; }
    public int getSortOrder() { return sortOrder; }
}
