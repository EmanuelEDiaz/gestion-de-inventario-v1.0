package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.ProductEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
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

    @Query("SELECT * FROM products WHERE " +
           "(:search IS NULL OR LOWER(name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(sku) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:categoryId IS NULL OR category_id = :categoryId) " +
           "AND (:status IS NULL OR status = :status) " +
           "AND (:minPrice IS NULL OR sale_price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR sale_price <= :maxPrice) " +
           "AND (:unitOfMeasure IS NULL OR unit_of_measure = :unitOfMeasure) " +
           "ORDER BY " +
           "CASE WHEN :sortAsc THEN LOWER(:sortBy) END ASC, " +
           "CASE WHEN NOT :sortAsc THEN LOWER(:sortBy) END DESC " +
           "LIMIT :size OFFSET :offset")
    Flux<ProductEntity> findWithFilter(String search, UUID categoryId, String status,
                                        BigDecimal minPrice, BigDecimal maxPrice, String unitOfMeasure,
                                        String sortBy, boolean sortAsc, int offset, int size);

    @Query("SELECT * FROM products WHERE " +
           "(:cursor IS NULL OR id > :cursor::uuid) " +
           "AND (:status IS NULL OR status = :status) " +
           "AND (:search IS NULL OR LOWER(name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(sku) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:categoryId IS NULL OR category_id = :categoryId) " +
           "AND (:minPrice IS NULL OR sale_price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR sale_price <= :maxPrice) " +
           "AND (:unitOfMeasure IS NULL OR unit_of_measure = :unitOfMeasure) " +
           "ORDER BY " +
           "CASE WHEN :sortAsc THEN LOWER(:sortBy) END ASC, " +
           "CASE WHEN NOT :sortAsc THEN LOWER(:sortBy) END DESC " +
           "LIMIT :size")
    Flux<ProductEntity> findWithCursorAndFilter(String cursor, int size, String status,
                                                String search, UUID categoryId,
                                                BigDecimal minPrice, BigDecimal maxPrice, String unitOfMeasure,
                                                String sortBy, boolean sortAsc);

    @org.springframework.data.r2dbc.repository.Modifying
    @Query("UPDATE products SET main_image = :filePath, updated_at = NOW() WHERE id = :productId")
    Mono<Integer> updateMainImage(UUID productId, String filePath);

    @org.springframework.data.r2dbc.repository.Modifying
    @Query("UPDATE products SET main_image = NULL, updated_at = NOW() WHERE id = :productId")
    Mono<Integer> clearMainImage(UUID productId);
}
