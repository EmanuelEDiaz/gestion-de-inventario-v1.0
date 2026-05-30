package com.inventory.adapters.web.dto.report;

import java.math.BigDecimal;
import java.util.UUID;

public record TopCustomerEntry(
    UUID customerId,
    String customerName,
    long totalPurchases,
    BigDecimal totalRevenue,
    BigDecimal debtBalance
) {}
