package com.inventory.application.transfer.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * DTO de respuesta para Transfer.
 */
public record TransferDto(
    UUID id,
    String transferNumber,
    UUID fromWarehouseId,
    String fromWarehouseName,
    UUID toWarehouseId,
    String toWarehouseName,
    String status,
    String notes,
    LocalDate transferDate,
    LocalDate receivedDate,
    UUID createdBy,
    Instant createdAt,
    Instant updatedAt,
    List<TransferLineDto> lines
) {
    public record TransferLineDto(
        UUID id,
        UUID productId,
        String productName,
        String productSku,
        BigDecimal quantity,
        BigDecimal receivedQty,
        int sortOrder
    ) {}
}
