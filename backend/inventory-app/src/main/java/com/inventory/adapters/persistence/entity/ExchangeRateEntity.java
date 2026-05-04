package com.inventory.adapters.persistence.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Table("exchange_rates")
public class ExchangeRateEntity {

    @Id
    private UUID id;

    @Column("base_code")
    private String baseCode;

    @Column("quote_code")
    private String quoteCode;

    @Column("rate")
    private BigDecimal rate;

    @Column("rate_type")
    private String rateType;

    @Column("valid_from")
    private Instant validFrom;

    @Column("created_by")
    private UUID createdBy;

    @Column("created_at")
    private Instant createdAt;

    public ExchangeRateEntity() {}

    public ExchangeRateEntity(UUID id, String baseCode, String quoteCode, BigDecimal rate,
                               String rateType, Instant validFrom, UUID createdBy, Instant createdAt) {
        this.id        = id;
        this.baseCode  = baseCode;
        this.quoteCode = quoteCode;
        this.rate      = rate;
        this.rateType  = rateType;
        this.validFrom = validFrom;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }

    public UUID getId()          { return id; }
    public String getBaseCode()  { return baseCode; }
    public String getQuoteCode() { return quoteCode; }
    public BigDecimal getRate()  { return rate; }
    public String getRateType()  { return rateType; }
    public Instant getValidFrom(){ return validFrom; }
    public UUID getCreatedBy()   { return createdBy; }
    public Instant getCreatedAt(){ return createdAt; }

    public void setId(UUID id)               { this.id = id; }
    public void setBaseCode(String v)        { this.baseCode = v; }
    public void setQuoteCode(String v)       { this.quoteCode = v; }
    public void setRate(BigDecimal v)        { this.rate = v; }
    public void setRateType(String v)        { this.rateType = v; }
    public void setValidFrom(Instant v)      { this.validFrom = v; }
    public void setCreatedBy(UUID v)         { this.createdBy = v; }
    public void setCreatedAt(Instant v)      { this.createdAt = v; }
}
