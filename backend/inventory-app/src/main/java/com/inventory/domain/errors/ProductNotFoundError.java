package com.inventory.domain.errors;

import java.util.UUID;

public class ProductNotFoundError extends DomainException {

    private final UUID productId;

    public ProductNotFoundError(UUID productId) {
        super("PRODUCT_NOT_FOUND", "Producto no encontrado: " + productId);
        this.productId = productId;
    }

    public ProductNotFoundError(String identifier) {
        super("PRODUCT_NOT_FOUND", "Producto no encontrado: " + identifier);
        this.productId = null;
    }

    public UUID getProductId() {
        return productId;
    }
}
