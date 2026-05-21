package com.inventory.domain.model.supplier;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Value Object: Producto del catálogo de un proveedor.
 * Vincula un producto del sistema (o uno libre) con un proveedor y su precio de venta al negocio.
 */
public record SupplierCatalogProduct(
    UUID id,
    UUID supplierId,
    UUID productId,
    String description,
    BigDecimal unitPrice,
    String currencyCode
) {
    public SupplierCatalogProduct {
        if (supplierId == null) throw new IllegalArgumentException("supplierId cannot be null");
        if (unitPrice != null && unitPrice.compareTo(BigDecimal.ZERO) < 0)
            throw new IllegalArgumentException("unitPrice cannot be negative");
        if (id == null) id = UUID.randomUUID();
    }

    public static SupplierCatalogProduct create(UUID supplierId, UUID productId,
                                                String description, BigDecimal unitPrice,
                                                String currencyCode) {
        return new SupplierCatalogProduct(UUID.randomUUID(), supplierId, productId,
                                          description, unitPrice, currencyCode);
    }
}
