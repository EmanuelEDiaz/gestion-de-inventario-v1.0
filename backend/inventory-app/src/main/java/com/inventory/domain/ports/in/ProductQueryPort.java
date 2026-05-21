package com.inventory.domain.ports.in;

import com.inventory.domain.model.product.Product;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada: Consultas de Productos.
 * Define las operaciones de lectura disponibles para el catálogo de productos.
 */
public interface ProductQueryPort {

    Mono<Product> findById(UUID id);

    Mono<Product> findBySku(String sku);

    Mono<Product> findByBarcode(String barcode);

    Flux<Product> findAll(int page, int size, boolean activeOnly);

    Flux<Product> findAllWithCursor(String cursor, ProductFilter filter, boolean activeOnly);

    Flux<Product> findByCategory(UUID categoryId);

    Flux<Product> search(String query);

    Mono<Long> count();

    Mono<Long> countByStatus(Product.ProductStatus status);
}
