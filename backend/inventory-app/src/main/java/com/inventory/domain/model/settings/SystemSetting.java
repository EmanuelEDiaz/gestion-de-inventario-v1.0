package com.inventory.domain.model.settings;

import java.time.Instant;

public class SystemSetting {
    private final String key;
    private final String value;
    private final String valueType;
    private final String description;
    private final boolean isPublic;
    private final Instant updatedAt;

    public SystemSetting(String key, String value, String valueType,
                          String description, boolean isPublic, Instant updatedAt) {
        this.key = key;
        this.value = value;
        this.valueType = valueType;
        this.description = description;
        this.isPublic = isPublic;
        this.updatedAt = updatedAt;
    }

    public String key() { return key; }
    public String value() { return value; }
    public String valueType() { return valueType; }
    public String description() { return description; }
    public boolean isPublic() { return isPublic; }
    public Instant updatedAt() { return updatedAt; }
}
