package com.inventory.domain.model;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Representa un usuario del sistema.
 * Inmutable - dominio puro sin dependencias de framework.
 */
public final class User {
    
    private final UUID id;
    private final String username;
    private final String passwordHash;
    private final String displayName;
    private final String email;
    private final Role role;
    private final boolean isActive;
    private final Instant createdAt;
    private final Instant updatedAt;
    
    public User(UUID id, String username, String passwordHash, String displayName, 
                String email, Role role, boolean isActive, 
                Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.username = Objects.requireNonNull(username, "username cannot be null");
        this.passwordHash = Objects.requireNonNull(passwordHash, "passwordHash cannot be null");
        this.displayName = Objects.requireNonNull(displayName, "displayName cannot be null");
        this.email = email;
        this.role = Objects.requireNonNull(role, "role cannot be null");
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    /**
     * Crea un nuevo usuario.
     */
    public static User create(String username, String passwordHash, String displayName, 
                              String email, Role role) {
        return new User(
                UUID.randomUUID(),
                username,
                passwordHash,
                displayName,
                email,
                role,
                true,
                Instant.now(),
                Instant.now()
        );
    }
    
    /**
     * Verifica si el usuario tiene un permiso específico.
     */
    public boolean hasPermission(String permissionCode) {
        return role != null && role.hasPermission(permissionCode);
    }
    
    /**
     * Crea una copia del usuario desactivado.
     */
    public User deactivate() {
        return new User(id, username, passwordHash, displayName, email, role, 
                       false, createdAt, Instant.now());
    }
    
    public UUID getId() {
        return id;
    }
    
    public String getUsername() {
        return username;
    }
    
    public String getPasswordHash() {
        return passwordHash;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getEmail() {
        return email;
    }
    
    public Role getRole() {
        return role;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    public Instant getUpdatedAt() {
        return updatedAt;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(id, user.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return "User{id=" + id + ", username='" + username + "', role=" + (role != null ? role.getCode() : "null") + "}";
    }
}
