package com.inventory.application.dto.report;

import java.math.BigDecimal;

public record SalesReportResponse(
    BigDecimal totalRevenue,
    BigDecimal totalCost,
    BigDecimal totalProfit,
    long salesCount,
    String period
) {}
