package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.SupplierSocialLinkEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface R2dbcSupplierSocialLinkRepository extends ReactiveCrudRepository<SupplierSocialLinkEntity, UUID> {

    @Query("SELECT * FROM supplier_social_links WHERE supplier_id = :supplierId ORDER BY sort_order ASC")
    Flux<SupplierSocialLinkEntity> findBySupplierId(UUID supplierId);

    @Query("DELETE FROM supplier_social_links WHERE supplier_id = :supplierId")
    Mono<Void> deleteBySupplierId(UUID supplierId);
}
