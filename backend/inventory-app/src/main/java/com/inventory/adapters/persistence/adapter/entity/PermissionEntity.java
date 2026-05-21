package com.inventory.adapters.persistence.adapter.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad R2DBC para permisos.
 */
@Table("permissions")
public class PermissionEntity {
    
    @Id
    private UUID id;
    
    @Column("code")
    private String code;
    
    @Column("name")
    private String name;
    
    @Column("category")
    private String category;
    
    @Column("created_at")
    private Instant createdAt;
    
    public PermissionEntity() {}
    
    public PermissionEntity(UUID id, String code, String name, String category, Instant createdAt) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.category = category;
        this.createdAt = createdAt;
    }
    
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
