package com.inventory.domain.ports.out;

import com.inventory.domain.model.product.Product;
import com.inventory.domain.ports.in.product.ProductFilter;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de salida: Repositorio de Productos.
 */
public interface ProductRepository {
    
    Mono<Product> findById(UUID id);
    
    Mono<Product> findBySku(String sku);
    
    Mono<Product> findByBarcode(String barcode);
    
    Flux<Product> findAll();
    
    Flux<Product> findAllActive();
    
    Flux<Product> findByCategory(UUID categoryId);
    
    Flux<Product> findByStatus(Product.ProductStatus status);
    
    /**
     * Busca productos por nombre, SKU o código de barras.
     */
    Flux<Product> search(String query);
    
    /**
     * Búsqueda paginada de productos.
     */
    Flux<Product> findAllPaginated(int page, int size);
    
    /**
     * Búsqueda con cursor-based pagination y filtros.
     * @param cursor UUID del último producto recibido (null para primera página)
     * @param filter Filtro con parámetros de búsqueda, ordenamiento, etc.
     * @param activeOnly Si true, solo retorna productos activos
     */
    Flux<Product> findAllWithCursor(String cursor, ProductFilter filter, boolean activeOnly);
    
    /**
     * Búsqueda con filtros dinámicos.
     */
    Flux<Product> findAllFiltered(ProductFilter filter, boolean activeOnly);
    
    /**
     * Búsqueda de productos por almacén específico.
     */
    Flux<Product> findAllByWarehouse(UUID warehouseId, String search, UUID categoryId, String status, boolean activeOnly);
    
    Mono<Long> count();
    
    Mono<Long> countByStatus(Product.ProductStatus status);
    
    Mono<Product> save(Product product);
    
    Mono<Void> updateMainImage(UUID productId, String filePath);
    
    Mono<Void> clearMainImage(UUID productId);
    
    Mono<Boolean> existsBySku(String sku);
    
    Mono<Boolean> existsByBarcode(String barcode);
    
    Mono<Boolean> existsById(UUID id);
    
    Mono<Void> deleteById(UUID id);
}
