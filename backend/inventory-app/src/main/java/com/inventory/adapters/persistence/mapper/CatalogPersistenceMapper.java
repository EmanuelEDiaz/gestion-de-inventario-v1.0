package com.inventory.adapters.persistence.mapper;

import com.inventory.adapters.persistence.entity.*;
import com.inventory.domain.model.*;
import org.springframework.stereotype.Component;

/**
 * Mapper para entidades del catálogo (Warehouse, Category, Supplier, Customer, Product).
 */
@Component
public class CatalogPersistenceMapper {

    // ===================== WAREHOUSE =====================

    public Warehouse toDomain(WarehouseEntity entity) {
        if (entity == null) return null;
        return new Warehouse(
            entity.getId(),
            entity.getCode(),
            entity.getName(),
            entity.getAddress(),
            entity.isActive(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            entity.getVersion() != null ? entity.getVersion() : 0
        );
    }

    public WarehouseEntity toEntity(Warehouse domain, boolean isNew) {
        if (domain == null) return null;
        WarehouseEntity entity = new WarehouseEntity();
        entity.setId(domain.getId());
        entity.setCode(domain.getCode());
        entity.setName(domain.getName());
        entity.setAddress(domain.getAddress());
        entity.setActive(domain.isActive());
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setUpdatedAt(domain.getUpdatedAt());
        entity.setVersion(domain.getVersion());
        entity.setNew(isNew);
        return entity;
    }

    // ===================== CATEGORY =====================

    public Category toDomain(CategoryEntity entity) {
        if (entity == null) return null;
        return new Category(
            entity.getId(),
            entity.getParentId(),
            entity.getName(),
            entity.getPath(),
            entity.getLevel(),
            entity.getSortOrder(),
            entity.isActive(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            entity.getVersion() != null ? entity.getVersion() : 0
        );
    }

    public CategoryEntity toEntity(Category domain, boolean isNew) {
        if (domain == null) return null;
        CategoryEntity entity = new CategoryEntity();
        entity.setId(domain.getId());
        entity.setParentId(domain.getParentId());
        entity.setName(domain.getName());
        entity.setPath(domain.getPath());
        entity.setLevel(domain.getLevel());
        entity.setSortOrder(domain.getSortOrder());
        entity.setActive(domain.isActive());
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setUpdatedAt(domain.getUpdatedAt());
        entity.setVersion(domain.getVersion());
        entity.setNew(isNew);
        return entity;
    }

    // ===================== SUPPLIER =====================

    public Supplier toDomain(SupplierEntity entity) {
        if (entity == null) return null;
        return new Supplier(
            entity.getId(),
            entity.getCode(),
            entity.getName(),
            entity.getContactName(),
            entity.getPhone(),
            entity.getEmail(),
            entity.getAddress(),
            entity.getNotes(),
            entity.isActive(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            entity.getVersion() != null ? entity.getVersion() : 0
        );
    }

    public SupplierEntity toEntity(Supplier domain, boolean isNew) {
        if (domain == null) return null;
        SupplierEntity entity = new SupplierEntity();
        entity.setId(domain.getId());
        entity.setCode(domain.getCode());
        entity.setName(domain.getName());
        entity.setContactName(domain.getContactName());
        entity.setPhone(domain.getPhone());
        entity.setEmail(domain.getEmail());
        entity.setAddress(domain.getAddress());
        entity.setNotes(domain.getNotes());
        entity.setActive(domain.isActive());
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setUpdatedAt(domain.getUpdatedAt());
        entity.setVersion(domain.getVersion());
        entity.setNew(isNew);
        return entity;
    }

    // ===================== CUSTOMER =====================

    public Customer toDomain(CustomerEntity entity) {
        if (entity == null) return null;
        return new Customer(
            entity.getId(),
            entity.getCode(),
            entity.getName(),
            entity.getContactName(),
            entity.getPhone(),
            entity.getEmail(),
            entity.getAddress(),
            entity.getNotes(),
            entity.isActive(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            entity.getVersion() != null ? entity.getVersion() : 0
        );
    }

    public CustomerEntity toEntity(Customer domain, boolean isNew) {
        if (domain == null) return null;
        CustomerEntity entity = new CustomerEntity();
        entity.setId(domain.getId());
        entity.setCode(domain.getCode());
        entity.setName(domain.getName());
        entity.setContactName(domain.getContactName());
        entity.setPhone(domain.getPhone());
        entity.setEmail(domain.getEmail());
        entity.setAddress(domain.getAddress());
        entity.setNotes(domain.getNotes());
        entity.setActive(domain.isActive());
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setUpdatedAt(domain.getUpdatedAt());
        entity.setVersion(domain.getVersion());
        entity.setNew(isNew);
        return entity;
    }

    // ===================== PRODUCT =====================

    public Product toDomain(ProductEntity entity) {
        if (entity == null) return null;
        return new Product(
            entity.getId(),
            entity.getSku(),
            entity.getBarcode(),
            entity.getName(),
            entity.getDescription(),
            entity.getCategoryId(),
            parseProductStatus(entity.getStatus()),
            parseCostMethod(entity.getCostMethod()),
            entity.getStandardCost(),
            entity.getSalePrice(),
            entity.getReorderPoint(),
            entity.getCurrencyCode(),
            entity.getTaxRate(),
            entity.getUnitOfMeasure(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            entity.getVersion() != null ? entity.getVersion() : 0
        );
    }

    public ProductEntity toEntity(Product domain, boolean isNew) {
        if (domain == null) return null;
        ProductEntity entity = new ProductEntity();
        entity.setId(domain.getId());
        entity.setSku(domain.getSku());
        entity.setBarcode(domain.getBarcode());
        entity.setName(domain.getName());
        entity.setDescription(domain.getDescription());
        entity.setCategoryId(domain.getCategoryId());
        entity.setStatus(domain.getStatus().name());
        entity.setCostMethod(domain.getCostMethod().name());
        entity.setStandardCost(domain.getStandardCost());
        entity.setSalePrice(domain.getSalePrice());
        entity.setReorderPoint(domain.getReorderPoint());
        entity.setCurrencyCode(domain.getCurrencyCode());
        entity.setTaxRate(domain.getTaxRate());
        entity.setUnitOfMeasure(domain.getUnitOfMeasure());
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setUpdatedAt(domain.getUpdatedAt());
        entity.setVersion(domain.getVersion());
        entity.setNew(isNew);
        return entity;
    }

    // Helpers
    private Product.ProductStatus parseProductStatus(String status) {
        if (status == null) return Product.ProductStatus.ACTIVE;
        try {
            return Product.ProductStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            return Product.ProductStatus.ACTIVE;
        }
    }

    private Product.CostMethod parseCostMethod(String method) {
        if (method == null) return Product.CostMethod.INHERIT;
        try {
            return Product.CostMethod.valueOf(method);
        } catch (IllegalArgumentException e) {
            return Product.CostMethod.INHERIT;
        }
    }
}
