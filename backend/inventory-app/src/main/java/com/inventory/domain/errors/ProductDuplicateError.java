package com.inventory.domain.errors;

public class ProductDuplicateError extends DomainException {

    private final String sku;

    public ProductDuplicateError(String sku) {
        super("PRODUCT_DUPLICATE", "Ya existe un producto con SKU: " + sku);
        this.sku = sku;
    }

    public String getSku() {
        return sku;
    }
}
