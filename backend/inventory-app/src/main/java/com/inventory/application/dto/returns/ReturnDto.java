package com.inventory.application.returns.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTO para respuestas de devolución.
 */
public record ReturnDto(
    UUID id,
    String returnNumber,
    String type,
    UUID warehouseId,
    String warehouseName,
    UUID originalDocumentId,
    String status,
    String reason,
    String notes,
    LocalDate returnDate,
    BigDecimal totalAmount,
    UUID createdBy,
    Instant createdAt,
    List<LineDto> lines
) {
    public record LineDto(
        UUID id,
        UUID productId,
        String productName,
        String productSku,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal subtotal
    ) {}
}
