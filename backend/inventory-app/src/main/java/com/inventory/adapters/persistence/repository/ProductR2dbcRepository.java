package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.ProductEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface ProductR2dbcRepository extends ReactiveCrudRepository<ProductEntity, UUID> {

    Mono<ProductEntity> findBySku(String sku);

    Mono<ProductEntity> findByBarcode(String barcode);

    @Query("SELECT * FROM products WHERE status = 'ACTIVE' ORDER BY name")
    Flux<ProductEntity> findAllActive();

    Flux<ProductEntity> findByCategoryId(UUID categoryId);

    Flux<ProductEntity> findByStatus(String status);

    @Query("SELECT * FROM products WHERE " +
           "LOWER(name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(sku) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "barcode LIKE CONCAT('%', :query, '%') " +
           "ORDER BY name LIMIT 100")
    Flux<ProductEntity> search(String query);

    @Query("SELECT * FROM products ORDER BY name LIMIT :size OFFSET :offset")
    Flux<ProductEntity> findAllPaginated(int offset, int size);

    Mono<Long> countByStatus(String status);

    Mono<Boolean> existsBySku(String sku);

    Mono<Boolean> existsByBarcode(String barcode);
}
