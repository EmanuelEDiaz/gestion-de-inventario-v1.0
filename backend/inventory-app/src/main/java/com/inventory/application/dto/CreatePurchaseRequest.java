package com.inventory.application.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreatePurchaseRequest(
    UUID warehouseId,
    UUID supplierId,
    String currencyCode,
    String notes,
    LocalDate purchaseDate,
    List<LineItem> lines
) {
    public record LineItem(
        UUID productId,
        BigDecimal quantity,
        BigDecimal unitCost
    ) {}
}
