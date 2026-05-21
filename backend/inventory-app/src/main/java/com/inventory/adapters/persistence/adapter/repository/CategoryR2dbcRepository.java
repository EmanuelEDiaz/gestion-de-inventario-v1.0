package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.CategoryEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface CategoryR2dbcRepository extends ReactiveCrudRepository<CategoryEntity, UUID> {

    @Query("SELECT * FROM categories WHERE is_active = true ORDER BY path, sort_order")
    Flux<CategoryEntity> findAllActive();

    @Query("SELECT * FROM categories WHERE parent_id IS NULL ORDER BY sort_order")
    Flux<CategoryEntity> findRoots();

    Flux<CategoryEntity> findByParentIdOrderBySortOrder(UUID parentId);

    @Query("SELECT * FROM categories WHERE path LIKE CONCAT(:path, '/%')")
    Flux<CategoryEntity> findDescendantsByPath(String path);

    Mono<Boolean> existsByName(String name);

    Mono<Boolean> existsByNameAndParentId(String name, UUID parentId);

    @Query("SELECT COUNT(*) FROM products WHERE category_id = :categoryId")
    Mono<Long> countProductsByCategoryId(UUID categoryId);
}
