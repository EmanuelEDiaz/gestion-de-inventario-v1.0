package com.inventory.domain.ports.out;

import com.inventory.domain.model.supplier.SupplierCatalogProduct;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de salida: Repositorio del catálogo de productos de proveedor.
 */
public interface SupplierCatalogProductRepository {

    Flux<SupplierCatalogProduct> findBySupplierId(UUID supplierId);

    Flux<SupplierCatalogProduct> findByProductId(UUID productId);

    Mono<SupplierCatalogProduct> findById(UUID id);

    Mono<SupplierCatalogProduct> save(SupplierCatalogProduct catalogProduct);

    Mono<Void> deleteById(UUID id);

    Mono<Void> deleteBySupplierId(UUID supplierId);
}
