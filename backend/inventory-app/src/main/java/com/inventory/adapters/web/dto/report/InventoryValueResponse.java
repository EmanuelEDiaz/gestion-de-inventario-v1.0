package com.inventory.adapters.web.dto.report;

import java.math.BigDecimal;

public record InventoryValueResponse(
    BigDecimal totalValue,
    BigDecimal totalCost,
    long productCount,
    BigDecimal avgCost,
    long lowStockCount
) {}
