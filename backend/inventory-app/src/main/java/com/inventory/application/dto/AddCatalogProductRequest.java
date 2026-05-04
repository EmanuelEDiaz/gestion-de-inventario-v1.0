package com.inventory.application.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record AddCatalogProductRequest(
    UUID productId,
    String description,
    BigDecimal unitPrice,
    String currencyCode
) {}
