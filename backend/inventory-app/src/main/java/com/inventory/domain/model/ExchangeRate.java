package com.inventory.domain.model;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Entidad de dominio: Tipo de Cambio.
 * Representa la tasa de cambio entre dos monedas.
 */
public class ExchangeRate {
    private final String id;
    private final String fromCurrency;
    private final String toCurrency;
    private final BigDecimal rate;
    private final boolean active;
    private final Instant effectiveDate;
    private final Instant createdAt;

    public ExchangeRate(String id, String fromCurrency, String toCurrency, 
                      BigDecimal rate, boolean active, Instant effectiveDate, Instant createdAt) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("ExchangeRate id cannot be null or blank");
        }
        if (fromCurrency == null || fromCurrency.isBlank()) {
            throw new IllegalArgumentException("From currency cannot be null or blank");
        }
        if (toCurrency == null || toCurrency.isBlank()) {
            throw new IllegalArgumentException("To currency cannot be null or blank");
        }
        if (rate == null || rate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Rate must be greater than zero");
        }
        this.id = id;
        this.fromCurrency = fromCurrency.toUpperCase();
        this.toCurrency = toCurrency.toUpperCase();
        this.rate = rate;
        this.active = active;
        this.effectiveDate = effectiveDate != null ? effectiveDate : Instant.now();
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public static ExchangeRate create(String fromCurrency, String toCurrency, BigDecimal rate) {
        String id = fromCurrency.toUpperCase() + "-" + toCurrency.toUpperCase() + "-" + 
                  System.currentTimeMillis();
        return new ExchangeRate(id, fromCurrency, toCurrency, rate, true, Instant.now(), Instant.now());
    }

    // Getters
    public String getId() { return id; }
    public String getFromCurrency() { return fromCurrency; }
    public String getToCurrency() { return toCurrency; }
    public BigDecimal getRate() { return rate; }
    public boolean isActive() { return active; }
    public Instant getEffectiveDate() { return effectiveDate; }
    public Instant getCreatedAt() { return createdAt; }

    public ExchangeRate deactivate() {
        return new ExchangeRate(id, fromCurrency, toCurrency, rate, false, effectiveDate, createdAt);
    }

    public ExchangeRate activate() {
        return new ExchangeRate(id, fromCurrency, toCurrency, rate, true, effectiveDate, createdAt);
    }

    public ExchangeRate updateRate(BigDecimal newRate) {
        if (newRate == null || newRate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Rate must be greater than zero");
        }
        return new ExchangeRate(id, fromCurrency, toCurrency, newRate, active, Instant.now(), createdAt);
    }
}