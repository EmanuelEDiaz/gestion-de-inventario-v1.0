package com.inventory.application.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO para ítem con bajo stock en el dashboard.
 */
public record LowStockItemDto(
    UUID productId,
    String productName,
    String productSku,
    UUID warehouseId,
    String warehouseName,
    BigDecimal onHand,
    BigDecimal reorderPoint
) {}
