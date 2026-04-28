package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.SupplierImageEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface R2dbcSupplierImageRepository extends ReactiveCrudRepository<SupplierImageEntity, UUID> {

    @Query("SELECT * FROM supplier_images WHERE supplier_id = :supplierId ORDER BY sort_order ASC")
    Flux<SupplierImageEntity> findBySupplierId(UUID supplierId);

    @Query("DELETE FROM supplier_images WHERE supplier_id = :supplierId")
    Mono<Void> deleteBySupplierId(UUID supplierId);
}
