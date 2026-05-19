package com.inventory.domain.errors;

import java.util.UUID;

public class SaleNotFoundError extends DomainException {

    private final UUID saleId;

    public SaleNotFoundError(UUID saleId) {
        super("SALE_NOT_FOUND", "Venta no encontrada: " + saleId);
        this.saleId = saleId;
    }

    public SaleNotFoundError(String identifier) {
        super("SALE_NOT_FOUND", "Venta no encontrada: " + identifier);
        this.saleId = null;
    }

    public UUID getSaleId() {
        return saleId;
    }
}
