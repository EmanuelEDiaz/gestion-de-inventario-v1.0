package com.inventory.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTO para respuestas de ajuste de inventario.
 */
public record AdjustmentDto(
    UUID id,
    String adjustmentNumber,
    UUID warehouseId,
    String warehouseName,
    String type,
    String status,
    String reason,
    String notes,
    LocalDate adjustmentDate,
    UUID createdBy,
    Instant createdAt,
    List<LineDto> lines
) {
    public record LineDto(
        UUID id,
        UUID productId,
        String productName,
        String productSku,
        BigDecimal systemQty,
        BigDecimal countedQty,
        BigDecimal difference,
        BigDecimal unitCost
    ) {}
}
