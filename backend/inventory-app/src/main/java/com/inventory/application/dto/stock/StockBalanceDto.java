package com.inventory.application.stock.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record StockBalanceDto(
    UUID warehouseId,
    UUID productId,
    String warehouseName,
    String productName,
    String productSku,
    BigDecimal onHand,
    BigDecimal reserved,
    BigDecimal available,
    BigDecimal avgCost,
    BigDecimal totalValue,
    Instant updatedAt
) {}
