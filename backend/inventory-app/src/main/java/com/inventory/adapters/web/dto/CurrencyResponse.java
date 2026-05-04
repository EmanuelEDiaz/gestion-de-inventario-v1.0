package com.inventory.adapters.web.dto;

/**
 * DTO de respuesta para Moneda.
 */
public record CurrencyResponse(
    String code,
    String name,
    String symbol,
    boolean isActive
) {}
