package com.inventory.application.supplier.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record SupplierCatalogProductDto(
    UUID id,
    UUID supplierId,
    UUID productId,
    String description,
    BigDecimal unitPrice,
    String currencyCode
) {}
