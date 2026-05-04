package com.inventory.adapters.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * DTO para actualizar la configuración global del sistema.
 * Todos los campos son opcionales (PATCH semántico).
 */
public record AppSettingsUpdateRequest(

        @Pattern(regexp = "STANDARD|WAC|FIFO",
                message = "El método de costeo debe ser STANDARD, WAC o FIFO")
        String defaultCostMethod,

        @Size(min = 3, max = 3, message = "El código de moneda debe tener exactamente 3 letras")
        @Pattern(regexp = "[A-Z]{3}",
                message = "El código de moneda debe ser un código ISO 4217 válido (ej. CUP, USD, EUR)")
        String defaultCurrencyCode,

        @Size(max = 200, message = "El nombre de la empresa no puede superar los 200 caracteres")
        String companyName,

        @DecimalMin(value = "0.0",
                inclusive = true,
                message = "El umbral de stock bajo no puede ser negativo")
        BigDecimal lowStockThresholdDefault

) {}
