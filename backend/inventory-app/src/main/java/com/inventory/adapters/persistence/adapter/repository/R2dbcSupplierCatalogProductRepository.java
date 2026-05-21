package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.SupplierCatalogProductEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface R2dbcSupplierCatalogProductRepository extends ReactiveCrudRepository<SupplierCatalogProductEntity, UUID> {

    @Query("SELECT * FROM supplier_catalog_products WHERE supplier_id = :supplierId")
    Flux<SupplierCatalogProductEntity> findBySupplierId(UUID supplierId);

    @Query("SELECT * FROM supplier_catalog_products WHERE product_id = :productId")
    Flux<SupplierCatalogProductEntity> findByProductId(UUID productId);

    @Query("DELETE FROM supplier_catalog_products WHERE supplier_id = :supplierId")
    Mono<Void> deleteBySupplierId(UUID supplierId);
}
