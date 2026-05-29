package com.inventory.adapters.web.dto.report;

import java.math.BigDecimal;

public record InventoryReportResponse(
    long totalProducts,
    BigDecimal totalValue,
    long lowStockCount,
    long outOfStockCount
) {}
