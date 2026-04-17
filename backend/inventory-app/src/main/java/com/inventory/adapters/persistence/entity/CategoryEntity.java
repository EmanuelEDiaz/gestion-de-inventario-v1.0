package com.inventory.adapters.persistence.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.annotation.Version;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("categories")
public class CategoryEntity implements Persistable<UUID> {

    @Id
    private UUID id;

    @Column("parent_id")
    private UUID parentId;

    @Column("name")
    private String name;

    @Column("path")
    private String path;

    @Column("level")
    private int level;

    @Column("sort_order")
    private int sortOrder;

    @Column("is_active")
    private boolean active;

    @Column("created_at")
    private Instant createdAt;

    @Column("updated_at")
    private Instant updatedAt;

    @Version
    @Column("version")
    private Integer version;

    @Transient
    private boolean isNew = true;

    public CategoryEntity() {}

    // Getters y Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getParentId() { return parentId; }
    public void setParentId(UUID parentId) { this.parentId = parentId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }

    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }

    @Override
    public boolean isNew() { return isNew; }
    public void setNew(boolean isNew) { this.isNew = isNew; }
}
