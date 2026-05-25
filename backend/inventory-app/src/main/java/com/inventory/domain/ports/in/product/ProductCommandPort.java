package com.inventory.domain.ports.in.product;

import com.inventory.domain.model.product.Product;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Puerto de entrada: Comandos de Productos.
 * Define las operaciones de escritura para el catálogo de productos.
 */
public interface ProductCommandPort {

    /**
     * Crea un nuevo producto.
     */
    Mono<Product> create(CreateProductCommand command);

    /**
     * Actualiza un producto existente.
     */
    Mono<Product> update(UUID id, UpdateProductCommand command);

    /**
     * Archiva un producto (soft delete).
     */
    Mono<Product> archive(UUID id);

    /**
     * Activa un producto archivado.
     */
    Mono<Product> activate(UUID id);

    /**
     * Elimina permanentemente un producto.
     */
    Mono<Void> delete(UUID id);

    Mono<Void> deleteAll(List<UUID> ids);

    // ===== Command Records =====

    record CreateProductCommand(
        String name,
        String sku,
        String barcode,
        String description,
        UUID categoryId,
        BigDecimal standardCost,
        BigDecimal salePrice,
        BigDecimal reorderPoint,
        BigDecimal taxRate,
        String unitOfMeasure
    ) {}

    record UpdateProductCommand(
        String name,
        String sku,
        String barcode,
        String description,
        UUID categoryId,
        Product.CostMethod costMethod,
        BigDecimal standardCost,
        BigDecimal salePrice,
        BigDecimal reorderPoint,
        BigDecimal taxRate,
        String unitOfMeasure
    ) {}
}
