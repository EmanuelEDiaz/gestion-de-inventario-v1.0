package com.inventory.domain.ports.in.product;

import com.inventory.domain.model.product.Product;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Filtro para búsqueda de productos.
 */
public class ProductFilter {
    private final String search;
    private final UUID categoryId;
    private final Product.ProductStatus status;
    private final BigDecimal minPrice;
    private final BigDecimal maxPrice;
    private final String unitOfMeasure;
    private final String sortBy;
    private final boolean sortAsc;
    private final int page;
    private final int size;

    public ProductFilter(String search, UUID categoryId, Product.ProductStatus status,
                        BigDecimal minPrice, BigDecimal maxPrice, String unitOfMeasure,
                        String sortBy, boolean sortAsc, int page, int size) {
        this.search = search;
        this.categoryId = categoryId;
        this.status = status;
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.unitOfMeasure = unitOfMeasure;
        this.sortBy = sortBy;
        this.sortAsc = sortAsc;
        this.page = page >= 0 ? page : 0;
        this.size = size > 0 ? size : 20;
    }

    public static ProductFilter empty() {
        return new ProductFilter(null, null, null, null, null, null, "name", true, 0, 20);
    }

    public static ProductFilter byCategory(UUID categoryId) {
        return new ProductFilter(null, categoryId, null, null, null, null, "name", true, 0, 20);
    }

    public static ProductFilter byStatus(Product.ProductStatus status) {
        return new ProductFilter(null, null, status, null, null, null, "name", true, 0, 20);
    }

    public static ProductFilter search(String search) {
        return new ProductFilter(search, null, null, null, null, null, "name", true, 0, 20);
    }

    // Getters
    public String getSearch() { return search; }
    public UUID getCategoryId() { return categoryId; }
    public Product.ProductStatus getStatus() { return status; }
    public BigDecimal getMinPrice() { return minPrice; }
    public BigDecimal getMaxPrice() { return maxPrice; }
    public String getUnitOfMeasure() { return unitOfMeasure; }
    public String getSortBy() { return sortBy; }
    public boolean isSortAsc() { return sortAsc; }
    public int getPage() { return page; }
    public int getSize() { return size; }

    public boolean hasSearch() { return search != null && !search.isBlank(); }
    public boolean hasCategory() { return categoryId != null; }
    public boolean hasStatus() { return status != null; }
    public boolean hasMinPrice() { return minPrice != null && minPrice.compareTo(BigDecimal.ZERO) > 0; }
    public boolean hasMaxPrice() { return maxPrice != null && maxPrice.compareTo(BigDecimal.ZERO) > 0; }
    public boolean hasPriceRange() { return hasMinPrice() || hasMaxPrice(); }
    public boolean hasUnitOfMeasure() { return unitOfMeasure != null && !unitOfMeasure.isBlank(); }

    public boolean isEmpty() {
        return !hasSearch() && !hasCategory() && !hasStatus() && !hasPriceRange() && !hasUnitOfMeasure();
    }

    public ProductFilter withPage(int page) {
        return new ProductFilter(search, categoryId, status, minPrice, maxPrice, unitOfMeasure, sortBy, sortAsc, page, size);
    }

    public ProductFilter withSize(int size) {
        return new ProductFilter(search, categoryId, status, minPrice, maxPrice, unitOfMeasure, sortBy, sortAsc, page, size);
    }

    public ProductFilter withSort(String sortBy, boolean sortAsc) {
        return new ProductFilter(search, categoryId, status, minPrice, maxPrice, unitOfMeasure, sortBy, sortAsc, page, size);
    }
}