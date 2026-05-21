package com.inventory.adapters.web.dto.currency;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.Instant;

public record CreateExchangeRateRequest(
    @NotBlank(message = "La moneda base es obligatoria") String baseCode,
    @NotBlank(message = "La moneda cotización es obligatoria") String quoteCode,
    @NotNull(message = "La tasa es obligatoria") @Positive(message = "La tasa debe ser mayor a 0") BigDecimal rate,
    @NotNull(message = "El tipo de tasa es obligatorio") String rateType,
    Instant validFrom
) {}
