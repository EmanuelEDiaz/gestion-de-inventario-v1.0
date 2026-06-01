package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.ProductEntity;
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

    @Query("SELECT * FROM products ORDER BY name")
    Flux<ProductEntity> findAllOrdered();

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
           "CASE WHEN :sortBy = 'name' AND :sortAsc THEN LOWER(name) END ASC, " +
           "CASE WHEN :sortBy = 'name' AND NOT :sortAsc THEN LOWER(name) END DESC, " +
           "CASE WHEN :sortBy = 'sku' AND :sortAsc THEN LOWER(sku) END ASC, " +
           "CASE WHEN :sortBy = 'sku' AND NOT :sortAsc THEN LOWER(sku) END DESC, " +
           "CASE WHEN :sortBy = 'barcode' AND :sortAsc THEN barcode END ASC, " +
           "CASE WHEN :sortBy = 'barcode' AND NOT :sortAsc THEN barcode END DESC, " +
           "CASE WHEN :sortBy = 'sale_price' AND :sortAsc THEN sale_price END ASC, " +
           "CASE WHEN :sortBy = 'sale_price' AND NOT :sortAsc THEN sale_price END DESC, " +
           "CASE WHEN :sortBy = 'standard_cost' AND :sortAsc THEN standard_cost END ASC, " +
           "CASE WHEN :sortBy = 'standard_cost' AND NOT :sortAsc THEN standard_cost END DESC, " +
           "CASE WHEN :sortBy = 'reorder_point' AND :sortAsc THEN reorder_point END ASC, " +
           "CASE WHEN :sortBy = 'reorder_point' AND NOT :sortAsc THEN reorder_point END DESC, " +
           "CASE WHEN :sortBy = 'tax_rate' AND :sortAsc THEN tax_rate END ASC, " +
           "CASE WHEN :sortBy = 'tax_rate' AND NOT :sortAsc THEN tax_rate END DESC, " +
           "CASE WHEN :sortBy = 'created_at' AND :sortAsc THEN created_at END ASC, " +
           "CASE WHEN :sortBy = 'created_at' AND NOT :sortAsc THEN created_at END DESC, " +
           "CASE WHEN :sortBy = 'updated_at' AND :sortAsc THEN updated_at END ASC, " +
           "CASE WHEN :sortBy = 'updated_at' AND NOT :sortAsc THEN updated_at END DESC, " +
           "CASE WHEN :sortBy = 'status' AND :sortAsc THEN status END ASC, " +
           "CASE WHEN :sortBy = 'status' AND NOT :sortAsc THEN status END DESC, " +
           "LOWER(name) ASC, id ASC " +
           "LIMIT :size OFFSET :offset")
    Flux<ProductEntity> findWithFilter(String search, UUID categoryId, String status,
                                        BigDecimal minPrice, BigDecimal maxPrice, String unitOfMeasure,
                                        String sortBy, boolean sortAsc, int offset, int size);

    @Query("SELECT * FROM products WHERE " +
           "(:cursorName IS NULL OR (LOWER(name) > LOWER(:cursorName) OR (LOWER(name) = LOWER(:cursorName) AND id > :cursorId::uuid))) " +
           "AND (:status IS NULL OR status = :status) " +
           "AND (:search IS NULL OR LOWER(name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(sku) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:categoryId IS NULL OR category_id = :categoryId) " +
           "AND (:minPrice IS NULL OR sale_price >= :minPrice) " +
           "AND (:maxPrice IS NULL OR sale_price <= :maxPrice) " +
           "AND (:unitOfMeasure IS NULL OR unit_of_measure = :unitOfMeasure) " +
           "ORDER BY " +
           "CASE WHEN :sortBy = 'name' AND :sortAsc THEN LOWER(name) END ASC, " +
           "CASE WHEN :sortBy = 'name' AND NOT :sortAsc THEN LOWER(name) END DESC, " +
           "CASE WHEN :sortBy = 'sku' AND :sortAsc THEN LOWER(sku) END ASC, " +
           "CASE WHEN :sortBy = 'sku' AND NOT :sortAsc THEN LOWER(sku) END DESC, " +
           "CASE WHEN :sortBy = 'barcode' AND :sortAsc THEN barcode END ASC, " +
           "CASE WHEN :sortBy = 'barcode' AND NOT :sortAsc THEN barcode END DESC, " +
           "CASE WHEN :sortBy = 'sale_price' AND :sortAsc THEN sale_price END ASC, " +
           "CASE WHEN :sortBy = 'sale_price' AND NOT :sortAsc THEN sale_price END DESC, " +
           "CASE WHEN :sortBy = 'standard_cost' AND :sortAsc THEN standard_cost END ASC, " +
           "CASE WHEN :sortBy = 'standard_cost' AND NOT :sortAsc THEN standard_cost END DESC, " +
           "CASE WHEN :sortBy = 'reorder_point' AND :sortAsc THEN reorder_point END ASC, " +
           "CASE WHEN :sortBy = 'reorder_point' AND NOT :sortAsc THEN reorder_point END DESC, " +
           "CASE WHEN :sortBy = 'tax_rate' AND :sortAsc THEN tax_rate END ASC, " +
           "CASE WHEN :sortBy = 'tax_rate' AND NOT :sortAsc THEN tax_rate END DESC, " +
           "CASE WHEN :sortBy = 'created_at' AND :sortAsc THEN created_at END ASC, " +
           "CASE WHEN :sortBy = 'created_at' AND NOT :sortAsc THEN created_at END DESC, " +
           "CASE WHEN :sortBy = 'updated_at' AND :sortAsc THEN updated_at END ASC, " +
           "CASE WHEN :sortBy = 'updated_at' AND NOT :sortAsc THEN updated_at END DESC, " +
           "CASE WHEN :sortBy = 'status' AND :sortAsc THEN status END ASC, " +
           "CASE WHEN :sortBy = 'status' AND NOT :sortAsc THEN status END DESC, " +
           "LOWER(name) ASC, id ASC " +
           "LIMIT :size")
    Flux<ProductEntity> findWithCursorAndFilter(String cursorName, UUID cursorId, int size, String status,
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
