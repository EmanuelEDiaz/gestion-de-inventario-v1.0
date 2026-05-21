package com.inventory.adapters.web.dto.currency;

import jakarta.validation.constraints.Size;

public record UpdateCurrencyRequest(
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    String name,

    @Size(max = 10, message = "El símbolo no puede exceder 10 caracteres")
    String symbol,

    Boolean isActive
) {}
