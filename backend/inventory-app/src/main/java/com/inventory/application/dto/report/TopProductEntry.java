package com.inventory.application.dto.report;

import java.math.BigDecimal;
import java.util.UUID;

public record TopProductEntry(
    UUID productId,
    String productName,
    long totalSold,
    BigDecimal totalRevenue,
    long quantitySold
) {}
