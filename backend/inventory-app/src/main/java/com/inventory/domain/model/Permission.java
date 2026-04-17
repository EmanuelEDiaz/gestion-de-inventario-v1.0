package com.inventory.domain.model;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Representa un permiso individual en el sistema RBAC dinámico.
 * Inmutable - dominio puro sin dependencias de framework.
 */
public final class Permission {
    
    private final UUID id;
    private final String code;
    private final String name;
    private final String category;
    private final Instant createdAt;
    
    public Permission(UUID id, String code, String name, String category, Instant createdAt) {
        this.id = id;
        this.code = Objects.requireNonNull(code, "code cannot be null");
        this.name = name;
        this.category = category;
        this.createdAt = createdAt;
    }
    
    public static Permission create(String code, String name, String category) {
        return new Permission(null, code, name, category, Instant.now());
    }
    
    public UUID getId() {
        return id;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getName() {
        return name;
    }
    
    public String getCategory() {
        return category;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Permission that = (Permission) o;
        return Objects.equals(code, that.code);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(code);
    }
    
    @Override
    public String toString() {
        return "Permission{code='" + code + "', category='" + category + "'}";
    }
}
