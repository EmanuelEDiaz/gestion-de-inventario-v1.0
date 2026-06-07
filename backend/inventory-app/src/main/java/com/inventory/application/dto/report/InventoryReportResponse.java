package com.inventory.application.dto.report;

import java.math.BigDecimal;

public record InventoryReportResponse(
    long totalProducts,
    BigDecimal totalValue,
    long lowStockCount,
    long outOfStockCount
) {}
