package com.inventory.domain.ports.in.supplier;

import com.inventory.domain.model.supplier.SupplierCatalogProduct;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Puerto de entrada para comandos del catálogo de productos de proveedores.
 */
public interface SupplierCatalogProductCommandPort {

    Mono<SupplierCatalogProduct> add(AddCommand command);

    Mono<Void> delete(UUID catalogProductId);

    Flux<SupplierCatalogProduct> listBySupplierId(UUID supplierId);

    record AddCommand(
        UUID supplierId,
        UUID productId,
        String description,
        BigDecimal unitPrice,
        String currencyCode
    ) {}
}
