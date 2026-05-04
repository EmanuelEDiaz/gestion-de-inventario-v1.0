package com.inventory.adapters.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO de creación para Producto.
 */
public record CreateProductRequest(
    @Size(max = 50, message = "El SKU no puede exceder 50 caracteres")
    String sku,
    
    @Size(max = 50, message = "El código de barras no puede exceder 50 caracteres")
    String barcode,
    
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 200, message = "El nombre no puede exceder 200 caracteres")
    String name,
    
    @Size(max = 2000, message = "La descripción no puede exceder 2000 caracteres")
    String description,
    
    UUID categoryId,
    
    @PositiveOrZero(message = "El costo debe ser mayor o igual a cero")
    BigDecimal standardCost,
    
    @PositiveOrZero(message = "El precio debe ser mayor o igual a cero")
    BigDecimal salePrice,
    
    @PositiveOrZero(message = "El punto de reorden debe ser mayor o igual a cero")
    BigDecimal reorderPoint,
    
    String currencyCode,
    
    @PositiveOrZero(message = "La tasa de impuesto debe ser mayor o igual a cero")
    BigDecimal taxRate,
    
    String unitOfMeasure
) {}
