package com.inventory.adapters.persistence.adapter.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entidad R2DBC para la tabla app_settings.
 * Singleton: siempre existe un único registro con id = 'global'.
 */
@Table("app_settings")
public class AppSettingsEntity {

    @Id
    @Column("id")
    private String id;

    @Column("default_cost_method")
    private String defaultCostMethod;

    @Column("default_currency_code")
    private String defaultCurrencyCode;

    @Column("company_name")
    private String companyName;

    @Column("low_stock_threshold_default")
    private BigDecimal lowStockThresholdDefault;

    @Column("updated_by")
    private UUID updatedBy;

    @Column("updated_at")
    private Instant updatedAt;

    @Version
    @Column("version")
    private Integer version;

    public AppSettingsEntity() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDefaultCostMethod() { return defaultCostMethod; }
    public void setDefaultCostMethod(String defaultCostMethod) { this.defaultCostMethod = defaultCostMethod; }

    public String getDefaultCurrencyCode() { return defaultCurrencyCode; }
    public void setDefaultCurrencyCode(String defaultCurrencyCode) { this.defaultCurrencyCode = defaultCurrencyCode; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public BigDecimal getLowStockThresholdDefault() { return lowStockThresholdDefault; }
    public void setLowStockThresholdDefault(BigDecimal lowStockThresholdDefault) { this.lowStockThresholdDefault = lowStockThresholdDefault; }

    public UUID getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(UUID updatedBy) { this.updatedBy = updatedBy; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
}
