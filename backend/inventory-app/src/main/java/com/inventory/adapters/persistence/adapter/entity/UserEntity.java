package com.inventory.adapters.persistence.adapter.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad R2DBC para usuarios.
 */
@Table("users")
public class UserEntity {
    
    @Id
    private UUID id;
    
    @Column("username")
    private String username;
    
    @Column("password_hash")
    private String passwordHash;
    
    @Column("display_name")
    private String displayName;
    
    @Column("email")
    private String email;
    
    @Column("role_id")
    private UUID roleId;
    
    @Column("is_active")
    private boolean isActive;
    
    @Column("created_at")
    private Instant createdAt;
    
    @Column("updated_at")
    private Instant updatedAt;

    @Column("preferences")
    private String preferences;
    
    /**
     * Rol asociado al usuario (cargado manualmente).
     */
    @Transient
    private RoleEntity role;
    
    public UserEntity() {}
    
    public UserEntity(UUID id, String username, String passwordHash, String displayName, 
                      String email, UUID roleId, boolean isActive, 
                      Instant createdAt, Instant updatedAt) {
        this.preferences = "{}";
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.displayName = displayName;
        this.email = email;
        this.roleId = roleId;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public UUID getRoleId() { return roleId; }
    public void setRoleId(UUID roleId) { this.roleId = roleId; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    
    public RoleEntity getRole() { return role; }
    public void setRole(RoleEntity role) { this.role = role; }

    public String getPreferences() { return preferences; }
    public void setPreferences(String preferences) { this.preferences = preferences; }
}
