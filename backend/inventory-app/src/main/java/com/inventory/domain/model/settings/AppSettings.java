package com.inventory.domain.model.settings;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Modelo de dominio: Configuración global del sistema (singleton, id='global').
 * Solo campos que se persisten en base de datos.
 */
public final class AppSettings {

    public enum CostMethod { STANDARD, WAC, FIFO }

    private final String id;
    private final CostMethod defaultCostMethod;
    private final String defaultCurrencyCode;
    private final String companyName;
    private final BigDecimal lowStockThresholdDefault;
    private final UUID updatedBy;
    private final Instant updatedAt;
    private final int version;

    public AppSettings(
            String id,
            CostMethod defaultCostMethod,
            String defaultCurrencyCode,
            String companyName,
            BigDecimal lowStockThresholdDefault,
            UUID updatedBy,
            Instant updatedAt,
            int version) {
        this.id = id;
        this.defaultCostMethod = defaultCostMethod;
        this.defaultCurrencyCode = defaultCurrencyCode;
        this.companyName = companyName;
        this.lowStockThresholdDefault = lowStockThresholdDefault;
        this.updatedBy = updatedBy;
        this.updatedAt = updatedAt;
        this.version = version;
    }

    /** Aplica los cambios parciales y retorna una nueva instancia actualizada. */
    public AppSettings applyUpdate(
            CostMethod newCostMethod,
            String newCurrencyCode,
            String newCompanyName,
            BigDecimal newLowStockThreshold,
            UUID actorId) {
        return new AppSettings(
                this.id,
                newCostMethod != null ? newCostMethod : this.defaultCostMethod,
                newCurrencyCode != null ? newCurrencyCode : this.defaultCurrencyCode,
                newCompanyName != null ? newCompanyName : this.companyName,
                newLowStockThreshold != null ? newLowStockThreshold : this.lowStockThresholdDefault,
                actorId,
                Instant.now(),
                this.version + 1
        );
    }

    public String getId() { return id; }
    public CostMethod getDefaultCostMethod() { return defaultCostMethod; }
    public String getDefaultCurrencyCode() { return defaultCurrencyCode; }
    public String getCompanyName() { return companyName; }
    public BigDecimal getLowStockThresholdDefault() { return lowStockThresholdDefault; }
    public UUID getUpdatedBy() { return updatedBy; }
    public Instant getUpdatedAt() { return updatedAt; }
    public int getVersion() { return version; }
}
