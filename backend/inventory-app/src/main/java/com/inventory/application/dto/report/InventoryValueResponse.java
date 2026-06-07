package com.inventory.application.dto.report;

import java.math.BigDecimal;

public record InventoryValueResponse(
    BigDecimal totalValue,
    BigDecimal totalCost,
    long productCount,
    BigDecimal avgCost,
    long lowStockCount
) {}
