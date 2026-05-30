package com.inventory.domain.model.geo;

import java.math.BigDecimal;
import java.util.UUID;

public class GeoRegion {
    private final UUID id;
    private final String countryCode;
    private final String level;
    private final String name;
    private final UUID parentId;
    private final BigDecimal latitude;
    private final BigDecimal longitude;
    private final boolean active;

    public GeoRegion(UUID id, String countryCode, String level, String name,
                     UUID parentId, BigDecimal latitude, BigDecimal longitude, boolean active) {
        this.id = id != null ? id : UUID.randomUUID();
        this.countryCode = countryCode;
        this.level = level;
        this.name = name;
        this.parentId = parentId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.active = active;
    }

    public UUID getId() { return id; }
    public String getCountryCode() { return countryCode; }
    public String getLevel() { return level; }
    public String getName() { return name; }
    public UUID getParentId() { return parentId; }
    public BigDecimal getLatitude() { return latitude; }
    public BigDecimal getLongitude() { return longitude; }
    public boolean isActive() { return active; }
}
