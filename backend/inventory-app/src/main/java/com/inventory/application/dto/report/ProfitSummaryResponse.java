package com.inventory.application.dto.report;

import java.math.BigDecimal;

public record ProfitSummaryResponse(
    BigDecimal totalRevenue,
    BigDecimal totalCost,
    BigDecimal totalProfit,
    BigDecimal profitMargin,
    long salesCount,
    BigDecimal avgSaleValue
) {}
