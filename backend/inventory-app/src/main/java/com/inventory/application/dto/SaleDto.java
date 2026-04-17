package com.inventory.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record SaleDto(
    UUID id,
    String saleNumber,
    UUID customerId,
    String customerName,
    UUID warehouseId,
    String warehouseName,
    String status,
    String currencyCode,
    BigDecimal exchangeRate,
    BigDecimal subtotal,
    BigDecimal discountAmount,
    BigDecimal taxAmount,
    BigDecimal total,
    String notes,
    LocalDate saleDate,
    UUID createdBy,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<SaleLineDto> lines
) {
    public record SaleLineDto(
        UUID id,
        UUID productId,
        String productName,
        String productSku,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal discount,
        BigDecimal totalPrice,
        int sortOrder
    ) {}
}
