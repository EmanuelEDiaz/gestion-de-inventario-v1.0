package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.ProductImageEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface R2dbcProductImageRepository extends ReactiveCrudRepository<ProductImageEntity, UUID> {

    @Query("SELECT * FROM product_images WHERE product_id = :productId ORDER BY sort_order ASC")
    Flux<ProductImageEntity> findByProductId(UUID productId);

    @Query("SELECT COUNT(*) FROM product_images WHERE product_id = :productId")
    Mono<Long> countByProductId(UUID productId);

    @Query("DELETE FROM product_images WHERE product_id = :productId")
    Mono<Void> deleteByProductId(UUID productId);
}