package com.inventory.domain.ports.in;

import com.inventory.domain.model.Product;

import java.util.UUID;

/**
 * Filtro para búsqueda de productos.
 */
public class ProductFilter {
    private final String search;
    private final UUID categoryId;
    private final Product.ProductStatus status;
    private final int page;
    private final int size;

    public ProductFilter(String search, UUID categoryId, Product.ProductStatus status, int page, int size) {
        this.search = search;
        this.categoryId = categoryId;
        this.status = status;
        this.page = page >= 0 ? page : 0;
        this.size = size > 0 ? size : 20;
    }

    public static ProductFilter empty() {
        return new ProductFilter(null, null, null, 0, 20);
    }

    public static ProductFilter byCategory(UUID categoryId) {
        return new ProductFilter(null, categoryId, null, 0, 20);
    }

    public static ProductFilter byStatus(Product.ProductStatus status) {
        return new ProductFilter(null, null, status, 0, 20);
    }

    public static ProductFilter search(String search) {
        return new ProductFilter(search, null, null, 0, 20);
    }

    // Getters
    public String getSearch() { return search; }
    public UUID getCategoryId() { return categoryId; }
    public Product.ProductStatus getStatus() { return status; }
    public int getPage() { return page; }
    public int getSize() { return size; }

    public boolean hasSearch() { return search != null && !search.isBlank(); }
    public boolean hasCategory() { return categoryId != null; }
    public boolean hasStatus() { return status != null; }
    public boolean isEmpty() { return !hasSearch() && !hasCategory() && !hasStatus(); }

    public ProductFilter withPage(int page) {
        return new ProductFilter(search, categoryId, status, page, size);
    }

    public ProductFilter withSize(int size) {
        return new ProductFilter(search, categoryId, status, page, size);
    }
}