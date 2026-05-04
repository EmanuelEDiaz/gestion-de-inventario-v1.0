package com.inventory.application.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PurchaseDto(
    UUID id,
    String purchaseNumber,
    UUID supplierId,
    String supplierName,
    UUID warehouseId,
    String warehouseName,
    String status,
    String currencyCode,
    BigDecimal exchangeRate,
    BigDecimal subtotal,
    BigDecimal taxAmount,
    BigDecimal total,
    String notes,
    LocalDate purchaseDate,
    LocalDate receivedDate,
    UUID createdBy,
    Instant createdAt,
    Instant updatedAt,
    List<PurchaseLineDto> lines
) {
    public record PurchaseLineDto(
        UUID id,
        UUID productId,
        String productName,
        String productSku,
        BigDecimal quantity,
        BigDecimal unitCost,
        BigDecimal totalCost,
        BigDecimal receivedQty,
        int sortOrder
    ) {}
}
