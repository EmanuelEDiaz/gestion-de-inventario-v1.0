package com.inventory.adapters.persistence.adapter.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.annotation.Version;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.util.UUID;

@Table("geo_regions")
public class GeoRegionEntity implements Persistable<UUID> {

    @Id
    private UUID id;

    @Column("country_code")
    private String countryCode;

    @Column("level")
    private String level;

    @Column("name")
    private String name;

    @Column("parent_id")
    private UUID parentId;

    @Column("latitude")
    private BigDecimal latitude;

    @Column("longitude")
    private BigDecimal longitude;

    @Column("active")
    private boolean active;

    @Version
    @Column("version")
    private Integer version;

    @Transient
    private boolean isNew = true;

    public GeoRegionEntity() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public UUID getParentId() { return parentId; }
    public void setParentId(UUID parentId) { this.parentId = parentId; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    @Override
    public boolean isNew() { return isNew; }
    public void setNew(boolean isNew) { this.isNew = isNew; }
}
