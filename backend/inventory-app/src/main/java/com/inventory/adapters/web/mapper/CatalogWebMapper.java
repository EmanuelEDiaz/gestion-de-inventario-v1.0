package com.inventory.adapters.web.mapper;

import com.inventory.adapters.web.dto.*;
import com.inventory.domain.model.product.Product;
import com.inventory.domain.model.category.Category;
import com.inventory.domain.model.warehouse.Warehouse;
import org.springframework.stereotype.Component;

/**
 * Mapper para DTOs web del catálogo.
 */
@Component
public class CatalogWebMapper {

    // ===================== WAREHOUSE =====================

    public WarehouseResponse toResponse(Warehouse domain) {
        if (domain == null) return null;
        return new WarehouseResponse(
            domain.getId(),
            domain.getCode(),
            domain.getName(),
            domain.getAddress(),
            domain.isActive(),
            domain.getCreatedAt(),
            domain.getUpdatedAt(),
            domain.getVersion()
        );
    }

    public Warehouse toDomain(CreateWarehouseRequest request) {
        return Warehouse.create(
            request.code(),
            request.name(),
            request.address()
        );
    }

    // ===================== CATEGORY =====================

    public CategoryResponse toResponse(Category domain) {
        if (domain == null) return null;
        return new CategoryResponse(
            domain.getId(),
            domain.getParentId(),
            domain.getName(),
            domain.getPath(),
            domain.getLevel(),
            domain.getSortOrder(),
            domain.isActive(),
            domain.getCreatedAt(),
            domain.getUpdatedAt(),
            domain.getVersion()
        );
    }

    // ===================== PRODUCT =====================

    public ProductResponse toResponse(Product domain) {
        return toResponse(domain, null);
    }

    public ProductResponse toResponse(Product domain, String categoryName) {
        if (domain == null) return null;
        return new ProductResponse(
            domain.getId(),
            domain.getSku(),
            domain.getBarcode(),
            domain.getName(),
            domain.getDescription(),
            domain.getCategoryId(),
            categoryName,
            domain.getStatus().name(),
            domain.getCostMethod().name(),
            domain.getStandardCost(),
            domain.getSalePrice(),
            domain.getReorderPoint(),
            domain.getCurrencyCode(),
            domain.getTaxRate(),
            domain.getUnitOfMeasure(),
            domain.getCreatedAt(),
            domain.getUpdatedAt(),
            domain.getVersion(),
            domain.getMainImage()
        );
    }

    public Product toDomain(CreateProductRequest request) {
        return new Product(
            null,
            request.sku(),
            request.barcode(),
            request.name(),
            request.description(),
            request.categoryId(),
            Product.ProductStatus.ACTIVE,
            Product.CostMethod.INHERIT,
            request.standardCost(),
            request.salePrice(),
            request.reorderPoint(),
            request.currencyCode() != null ? request.currencyCode() : "CUP",
            request.taxRate(),
            request.unitOfMeasure(),
            null, null, 0, null
        );
    }

    public Product applyUpdate(Product existing, UpdateProductRequest request) {
        return new Product(
            existing.getId(),
            request.sku() != null ? request.sku() : existing.getSku(),
            request.barcode() != null ? request.barcode() : existing.getBarcode(),
            request.name() != null ? request.name() : existing.getName(),
            request.description(),
            request.categoryId() != null ? request.categoryId() : existing.getCategoryId(),
            existing.getStatus(),
            request.costMethod() != null ? Product.CostMethod.valueOf(request.costMethod()) : existing.getCostMethod(),
            request.standardCost() != null ? request.standardCost() : existing.getStandardCost(),
            request.salePrice() != null ? request.salePrice() : existing.getSalePrice(),
            request.reorderPoint() != null ? request.reorderPoint() : existing.getReorderPoint(),
            existing.getCurrencyCode(),
            request.taxRate() != null ? request.taxRate() : existing.getTaxRate(),
            request.unitOfMeasure() != null ? request.unitOfMeasure() : existing.getUnitOfMeasure(),
            existing.getCreatedAt(),
            null,
            existing.getVersion(),
            existing.getMainImage()
        );
    }
}
