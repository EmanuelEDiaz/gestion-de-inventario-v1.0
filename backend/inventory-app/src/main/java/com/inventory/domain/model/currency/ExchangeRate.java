package com.inventory.domain.model.currency;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entidad de dominio: Tipo de Cambio.
 * Representa la tasa de cambio entre dos monedas en un momento dado.
 */
public class ExchangeRate {

    public enum RateType { OFFICIAL, MARKET, CUSTOM }

    private final UUID id;
    private final String baseCode;
    private final String quoteCode;
    private final BigDecimal rate;
    private final RateType rateType;
    private final Instant validFrom;
    private final UUID createdBy;
    private final Instant createdAt;

    public ExchangeRate(UUID id, String baseCode, String quoteCode,
                        BigDecimal rate, RateType rateType,
                        Instant validFrom, UUID createdBy, Instant createdAt) {
        if (baseCode == null || baseCode.isBlank()) throw new IllegalArgumentException("baseCode is required");
        if (quoteCode == null || quoteCode.isBlank()) throw new IllegalArgumentException("quoteCode is required");
        if (rate == null || rate.compareTo(BigDecimal.ZERO) <= 0) throw new IllegalArgumentException("rate must be > 0");
        this.id        = id;
        this.baseCode  = baseCode.toUpperCase();
        this.quoteCode = quoteCode.toUpperCase();
        this.rate      = rate;
        this.rateType  = rateType != null ? rateType : RateType.OFFICIAL;
        this.validFrom = validFrom != null ? validFrom : Instant.now();
        this.createdBy = createdBy;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    public static ExchangeRate create(String baseCode, String quoteCode, BigDecimal rate,
                                      RateType rateType, Instant validFrom, UUID createdBy) {
        return new ExchangeRate(UUID.randomUUID(), baseCode, quoteCode, rate, rateType,
                validFrom, createdBy, Instant.now());
    }

    public UUID getId()         { return id; }
    public String getBaseCode() { return baseCode; }
    public String getQuoteCode(){ return quoteCode; }
    public BigDecimal getRate() { return rate; }
    public RateType getRateType(){ return rateType; }
    public Instant getValidFrom(){ return validFrom; }
    public UUID getCreatedBy()  { return createdBy; }
    public Instant getCreatedAt(){ return createdAt; }
}
