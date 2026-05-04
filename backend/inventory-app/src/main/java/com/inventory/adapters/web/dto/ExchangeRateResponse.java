package com.inventory.adapters.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ExchangeRateResponse(
    UUID id,
    String baseCode,
    String quoteCode,
    BigDecimal rate,
    String rateType,
    Instant validFrom,
    UUID createdBy,
    Instant createdAt
) {}
