package com.inventory.adapters.web.dto.report;

import java.math.BigDecimal;

public record ProfitSummaryResponse(
    BigDecimal totalRevenue,
    BigDecimal totalCost,
    BigDecimal totalProfit,
    BigDecimal profitMargin,
    long salesCount,
    BigDecimal avgSaleValue
) {}
