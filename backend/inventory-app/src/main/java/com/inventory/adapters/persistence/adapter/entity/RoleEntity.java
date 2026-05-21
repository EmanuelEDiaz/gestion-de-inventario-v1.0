package com.inventory.adapters.persistence.adapter.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Entidad R2DBC para roles.
 */
@Table("roles")
public class RoleEntity {
    
    @Id
    private UUID id;
    
    @Column("code")
    private String code;
    
    @Column("name")
    private String name;
    
    @Column("description")
    private String description;
    
    @Column("is_system")
    private boolean isSystem;
    
    @Column("is_active")
    private boolean isActive;
    
    @Column("created_at")
    private Instant createdAt;
    
    @Column("updated_at")
    private Instant updatedAt;
    
    /**
     * Permisos asociados al rol (cargados manualmente debido a limitaciones de R2DBC).
     */
    @Transient
    private Set<PermissionEntity> permissions = new HashSet<>();
    
    public RoleEntity() {}
    
    public RoleEntity(UUID id, String code, String name, String description, boolean isSystem, 
                      boolean isActive, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.description = description;
        this.isSystem = isSystem;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public boolean isSystem() { return isSystem; }
    public void setSystem(boolean system) { isSystem = system; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    
    public Set<PermissionEntity> getPermissions() { return permissions; }
    public void setPermissions(Set<PermissionEntity> permissions) { this.permissions = permissions; }
}
