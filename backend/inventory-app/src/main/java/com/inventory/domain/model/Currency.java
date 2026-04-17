package com.inventory.domain.model;

import java.time.Instant;

/**
 * Entidad de dominio: Moneda.
 * Representa una divisa utilizada en el sistema.
 */
public class Currency {
    private final String code;
    private final String name;
    private final String symbol;
    private final boolean active;
    private final Instant createdAt;

    public Currency(String code, String name, String symbol, boolean active, Instant createdAt) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException("Currency code cannot be null or blank");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Currency name cannot be null or blank");
        }
        this.code = code.toUpperCase();
        this.name = name;
        this.symbol = symbol != null ? symbol : code;
        this.active = active;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public static Currency create(String code, String name, String symbol) {
        return new Currency(code, name, symbol, true, Instant.now());
    }

    // Getters
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getSymbol() { return symbol; }
    public boolean isActive() { return active; }
    public Instant getCreatedAt() { return createdAt; }

    public Currency deactivate() {
        return new Currency(code, name, symbol, false, createdAt);
    }

    public Currency activate() {
        return new Currency(code, name, symbol, true, createdAt);
    }
}
