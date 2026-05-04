package com.inventory.adapters.persistence.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

/**
 * Entidad R2DBC para monedas.
 */
@Table("currencies")
public class CurrencyEntity {

    @Id
    @Column("code")
    private String code;

    @Column("name")
    private String name;

    @Column("symbol")
    private String symbol;

    @Column("is_active")
    private boolean isActive;

    public CurrencyEntity() {}

    public CurrencyEntity(String code, String name, String symbol, boolean isActive) {
        this.code = code;
        this.name = name;
        this.symbol = symbol;
        this.isActive = isActive;
    }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}
