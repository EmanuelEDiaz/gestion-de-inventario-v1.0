package com.inventory.adapters.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCurrencyRequest(
    @NotBlank(message = "El código es obligatorio")
    @Pattern(regexp = "[A-Z]{3}", message = "El código debe ser 3 letras mayúsculas")
    String code,

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    String name,

    @Size(max = 10, message = "El símbolo no puede exceder 10 caracteres")
    String symbol
) {}
