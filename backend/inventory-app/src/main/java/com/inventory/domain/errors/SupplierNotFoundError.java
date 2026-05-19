package com.inventory.domain.errors;

import java.util.UUID;

public class SupplierNotFoundError extends DomainException {

    private final UUID supplierId;

    public SupplierNotFoundError(UUID supplierId) {
        super("SUPPLIER_NOT_FOUND", "Proveedor no encontrado: " + supplierId);
        this.supplierId = supplierId;
    }

    public SupplierNotFoundError(String identifier) {
        super("SUPPLIER_NOT_FOUND", "Proveedor no encontrado: " + identifier);
        this.supplierId = UUID.fromString(identifier);
    }

    public UUID getSupplierId() {
        return supplierId;
    }
}
