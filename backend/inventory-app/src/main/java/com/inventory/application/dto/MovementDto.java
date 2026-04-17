package com.inventory.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record MovementDto(
    UUID id,
    UUID warehouseId,
    UUID productId,
    String warehouseName,
    String productName,
    String productSku,
    String movementType,
    BigDecimal quantity,
    BigDecimal unitCost,
    BigDecimal unitPrice,
    BigDecimal totalCost,
    BigDecimal totalPrice,
    String currencyCode,
    BigDecimal exchangeRate,
    BigDecimal balanceAfter,
    String sourceDocType,
    UUID sourceDocId,
    String notes,
    Instant occurredAt,
    UUID createdBy,
    Instant createdAt
) {}
