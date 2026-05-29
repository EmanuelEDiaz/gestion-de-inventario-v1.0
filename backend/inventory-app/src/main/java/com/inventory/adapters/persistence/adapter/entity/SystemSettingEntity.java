package com.inventory.adapters.persistence.adapter.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("system_settings")
public class SystemSettingEntity {

    @Id
    @Column("key")
    private String key;

    @Column("value")
    private String value;

    @Column("value_type")
    private String valueType;

    @Column("description")
    private String description;

    @Column("is_public")
    private boolean isPublic;

    @Column("updated_by")
    private UUID updatedBy;

    @Column("updated_at")
    private Instant updatedAt;

    public SystemSettingEntity() {}

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getValueType() { return valueType; }
    public void setValueType(String valueType) { this.valueType = valueType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isPublic() { return isPublic; }
    public void setPublic(boolean isPublic) { this.isPublic = isPublic; }

    public UUID getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(UUID updatedBy) { this.updatedBy = updatedBy; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
