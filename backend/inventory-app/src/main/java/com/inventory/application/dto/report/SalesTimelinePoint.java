package com.inventory.application.dto.report;

import java.math.BigDecimal;

public record SalesTimelinePoint(
    String date,
    BigDecimal revenue,
    BigDecimal cost,
    BigDecimal profit,
    long count
) {}
