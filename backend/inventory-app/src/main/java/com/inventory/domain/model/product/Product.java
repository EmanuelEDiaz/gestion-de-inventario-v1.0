package com.inventory.domain.model.product;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entidad de dominio: Producto.
 * Representa un artículo que se puede comprar, vender y almacenar.
 */
public class Product {
    private final UUID id;
    private final String sku;
    private final String barcode;
    private final String name;
    private final String description;
    private final UUID categoryId;
    private final ProductStatus status;
    private final CostMethod costMethod;
    private final BigDecimal standardCost;
    private final BigDecimal salePrice;
    private final BigDecimal reorderPoint;
    private final String currencyCode;
    private final BigDecimal taxRate;
    private final String unitOfMeasure;
    private final Instant createdAt;
    private final Instant updatedAt;
    private final int version;
    private final String mainImage;

    public Product(UUID id, String sku, String barcode, String name, String description,
                   UUID categoryId, ProductStatus status, CostMethod costMethod, 
                   BigDecimal standardCost, BigDecimal salePrice, BigDecimal reorderPoint,
                   String currencyCode, BigDecimal taxRate, String unitOfMeasure,
                   Instant createdAt, Instant updatedAt, int version, String mainImage) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Product name cannot be null or blank");
        }
        this.id = id != null ? id : UUID.randomUUID();
        this.sku = sku;
        this.barcode = barcode;
        this.name = name.trim();
        this.description = description;
        this.categoryId = categoryId;
        this.status = status != null ? status : ProductStatus.ACTIVE;
        this.costMethod = costMethod != null ? costMethod : CostMethod.INHERIT;
        this.standardCost = standardCost;
        this.salePrice = salePrice;
        this.reorderPoint = reorderPoint;
        this.currencyCode = currencyCode != null ? currencyCode : "CUP";
        this.taxRate = taxRate != null ? taxRate : BigDecimal.ZERO;
        this.unitOfMeasure = unitOfMeasure != null ? unitOfMeasure : "UNIT";
        this.createdAt = createdAt != null ? createdAt : Instant.now();
        this.updatedAt = updatedAt != null ? updatedAt : this.createdAt;
        this.version = version;
        this.mainImage = mainImage;
    }

    public static Product create(String name, String sku, String barcode, BigDecimal salePrice) {
        return new Product(
            UUID.randomUUID(),
            sku,
            barcode,
            name,
            null,
            null,
            ProductStatus.ACTIVE,
            CostMethod.INHERIT,
            null,
            salePrice,
            null,
            "CUP",
            BigDecimal.ZERO,
            "UNIT",
            Instant.now(),
            Instant.now(),
            0,
            null
        );
    }

    // Getters
    public UUID getId() { return id; }
    public String getSku() { return sku; }
    public String getBarcode() { return barcode; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public UUID getCategoryId() { return categoryId; }
    public ProductStatus getStatus() { return status; }
    public CostMethod getCostMethod() { return costMethod; }
    public BigDecimal getStandardCost() { return standardCost; }
    public BigDecimal getSalePrice() { return salePrice; }
    public BigDecimal getReorderPoint() { return reorderPoint; }
    public String getCurrencyCode() { return currencyCode; }
    public BigDecimal getTaxRate() { return taxRate; }
    public String getUnitOfMeasure() { return unitOfMeasure; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public int getVersion() { return version; }
    public String getMainImage() { return mainImage; }

    public boolean isActive() {
        return status == ProductStatus.ACTIVE;
    }

    public boolean hasLowStockThreshold() {
        return reorderPoint != null && reorderPoint.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Calcula el precio con impuesto incluido.
     */
    public BigDecimal getPriceWithTax() {
        if (salePrice == null) return null;
        if (taxRate == null || taxRate.compareTo(BigDecimal.ZERO) == 0) {
            return salePrice;
        }
        return salePrice.multiply(BigDecimal.ONE.add(taxRate.divide(BigDecimal.valueOf(100))));
    }

    /**
     * Calcula el margen de ganancia.
     */
    public BigDecimal getMargin() {
        if (salePrice == null || standardCost == null || standardCost.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }
        return salePrice.subtract(standardCost).divide(salePrice, 4, java.math.RoundingMode.HALF_UP)
                       .multiply(BigDecimal.valueOf(100));
    }

    // Métodos de actualización (inmutables)
    public Product updateBasicInfo(String name, String description, String sku, String barcode) {
        return new Product(
            this.id, 
            sku != null ? sku : this.sku,
            barcode != null ? barcode : this.barcode,
            name != null ? name : this.name,
            description,
            this.categoryId, this.status, this.costMethod,
            this.standardCost, this.salePrice, this.reorderPoint,
            this.currencyCode, this.taxRate, this.unitOfMeasure,
            this.createdAt, Instant.now(), this.version,
            this.mainImage
        );
    }

    public Product updatePricing(BigDecimal standardCost, BigDecimal salePrice, BigDecimal taxRate) {
        return new Product(
            this.id, this.sku, this.barcode, this.name, this.description,
            this.categoryId, this.status, this.costMethod,
            standardCost,
            salePrice,
            this.reorderPoint,
            this.currencyCode,
            taxRate != null ? taxRate : this.taxRate,
            this.unitOfMeasure,
            this.createdAt, Instant.now(), this.version,
            this.mainImage
        );
    }

    public Product updateCategory(UUID categoryId) {
        return new Product(
            this.id, this.sku, this.barcode, this.name, this.description,
            categoryId, this.status, this.costMethod,
            this.standardCost, this.salePrice, this.reorderPoint,
            this.currencyCode, this.taxRate, this.unitOfMeasure,
            this.createdAt, Instant.now(), this.version,
            this.mainImage
        );
    }

    public Product updateCostMethod(CostMethod costMethod) {
        return new Product(
            this.id, this.sku, this.barcode, this.name, this.description,
            this.categoryId, this.status, costMethod,
            this.standardCost, this.salePrice, this.reorderPoint,
            this.currencyCode, this.taxRate, this.unitOfMeasure,
            this.createdAt, Instant.now(), this.version,
            this.mainImage
        );
    }

    public Product setReorderPoint(BigDecimal reorderPoint) {
        return new Product(
            this.id, this.sku, this.barcode, this.name, this.description,
            this.categoryId, this.status, this.costMethod,
            this.standardCost, this.salePrice, reorderPoint,
            this.currencyCode, this.taxRate, this.unitOfMeasure,
            this.createdAt, Instant.now(), this.version,
            this.mainImage
        );
    }

    public Product archive() {
        return new Product(
            this.id, this.sku, this.barcode, this.name, this.description,
            this.categoryId, ProductStatus.ARCHIVED, this.costMethod,
            this.standardCost, this.salePrice, this.reorderPoint,
            this.currencyCode, this.taxRate, this.unitOfMeasure,
            this.createdAt, Instant.now(), this.version,
            this.mainImage
        );
    }

    public Product activate() {
        return new Product(
            this.id, this.sku, this.barcode, this.name, this.description,
            this.categoryId, ProductStatus.ACTIVE, this.costMethod,
            this.standardCost, this.salePrice, this.reorderPoint,
            this.currencyCode, this.taxRate, this.unitOfMeasure,
            this.createdAt, Instant.now(), this.version,
            this.mainImage
        );
    }

    public Product withVersion(int newVersion) {
        return new Product(
            this.id, this.sku, this.barcode, this.name, this.description,
            this.categoryId, this.status, this.costMethod,
            this.standardCost, this.salePrice, this.reorderPoint,
            this.currencyCode, this.taxRate, this.unitOfMeasure,
            this.createdAt, this.updatedAt, newVersion,
            this.mainImage
        );
    }

    public Product withMainImage(String mainImage) {
        return new Product(
            this.id, this.sku, this.barcode, this.name, this.description,
            this.categoryId, this.status, this.costMethod,
            this.standardCost, this.salePrice, this.reorderPoint,
            this.currencyCode, this.taxRate, this.unitOfMeasure,
            this.createdAt, Instant.now(), this.version,
            mainImage
        );
    }

    public enum ProductStatus {
        ACTIVE, ARCHIVED
    }

    public enum CostMethod {
        INHERIT,    // Usa el método global
        STANDARD,   // Costo estándar fijo
        WAC,        // Promedio ponderado
        FIFO        // First In First Out
    }
}
