package com.inventory.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateSaleRequest(
    UUID warehouseId,
    UUID customerId,
    String currencyCode,
    String notes,
    LocalDate saleDate,
    List<SaleLineRequest> lines
) {
    public record SaleLineRequest(
        UUID productId,
        int quantity,
        BigDecimal unitPrice,
        BigDecimal discount
    ) {}
}
