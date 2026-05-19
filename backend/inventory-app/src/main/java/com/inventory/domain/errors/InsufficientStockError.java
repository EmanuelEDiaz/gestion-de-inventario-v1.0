package com.inventory.domain.errors;

import java.math.BigDecimal;
import java.util.UUID;

public class InsufficientStockError extends DomainException {

    private final UUID productId;
    private final BigDecimal available;
    private final BigDecimal requested;

    public InsufficientStockError(UUID productId, BigDecimal available, BigDecimal requested) {
        super("INSUFFICIENT_STOCK", "Stock insuficiente para producto " + productId
                + ": disponible " + available + ", solicitado " + requested);
        this.productId = productId;
        this.available = available;
        this.requested = requested;
    }

    public UUID getProductId() {
        return productId;
    }

    public BigDecimal getAvailable() {
        return available;
    }

    public BigDecimal getRequested() {
        return requested;
    }
}
