package com.inventory.adapters.web.dto.product;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * DTO de respuesta para Producto.
 */
public record ProductResponse(
    UUID id,
    String sku,
    String barcode,
    String name,
    String description,
    UUID categoryId,
    String categoryName,
    String status,
    String costMethod,
    BigDecimal standardCost,
    BigDecimal salePrice,
    BigDecimal reorderPoint,
    String currencyCode,
    BigDecimal taxRate,
    String unitOfMeasure,
    Instant createdAt,
    Instant updatedAt,
    int version,
    String mainImage
) {}
