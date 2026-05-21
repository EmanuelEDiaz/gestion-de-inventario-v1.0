package com.inventory.adapters.web.dto.currency;

/**
 * DTO de respuesta para Moneda.
 */
public record CurrencyResponse(
    String code,
    String name,
    String symbol,
    boolean isActive
) {}
