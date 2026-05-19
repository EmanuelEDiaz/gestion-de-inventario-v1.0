package com.inventory.domain.errors;

import java.math.BigDecimal;
import java.util.UUID;

public class ProductOutOfStockError extends DomainException {

    private final UUID productId;
    private final BigDecimal available;
    private final BigDecimal requested;

    public ProductOutOfStockError(UUID productId, BigDecimal available, BigDecimal requested) {
        super("PRODUCT_OUT_OF_STOCK", "Stock insuficiente para producto " + productId
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
