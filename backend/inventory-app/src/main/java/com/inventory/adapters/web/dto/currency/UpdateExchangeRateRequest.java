package com.inventory.adapters.web.dto.currency;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.Instant;

public record UpdateExchangeRateRequest(
    @NotNull(message = "La tasa es obligatoria") @Positive(message = "La tasa debe ser mayor a 0") BigDecimal rate,
    @NotNull(message = "El tipo de tasa es obligatorio") String rateType,
    Instant validFrom
) {}
