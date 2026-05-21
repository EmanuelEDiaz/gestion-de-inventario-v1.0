package com.inventory.domain.model.role;

import java.time.Instant;
import java.util.Collections;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Representa un rol en el sistema RBAC dinámico.
 * Puede ser un rol de sistema (ADMIN, SELLER) o un rol personalizado.
 * Inmutable - dominio puro sin dependencias de framework.
 */
public final class Role {
    
    private final UUID id;
    private final String code;
    private final String name;
    private final String description;
    private final boolean isSystem;
    private final boolean isActive;
    private final Set<Permission> permissions;
    private final Instant createdAt;
    private final Instant updatedAt;
    
    public Role(UUID id, String code, String name, String description, boolean isSystem, 
                boolean isActive, Set<Permission> permissions, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.code = Objects.requireNonNull(code, "code cannot be null");
        this.name = Objects.requireNonNull(name, "name cannot be null");
        this.description = description;
        this.isSystem = isSystem;
        this.isActive = isActive;
        this.permissions = permissions != null ? new HashSet<>(permissions) : new HashSet<>();
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
    
    /**
     * Crea un nuevo rol personalizado (no sistema).
     */
    public static Role createCustomRole(String code, String name, String description, Set<Permission> permissions) {
        return new Role(null, code, name, description, false, true, permissions, Instant.now(), Instant.now());
    }
    
    /**
     * Verifica si el rol tiene un permiso específico por código.
     */
    public boolean hasPermission(String permissionCode) {
        return permissions.stream()
                .anyMatch(p -> p.getCode().equals(permissionCode));
    }
    
    /**
     * Retorna los códigos de todos los permisos del rol.
     */
    public Set<String> getPermissionCodes() {
        Set<String> codes = new HashSet<>();
        for (Permission p : permissions) {
            codes.add(p.getCode());
        }
        return codes;
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
    
    public String getDescription() {
        return description;
    }
    
    public boolean isSystem() {
        return isSystem;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public Set<Permission> getPermissions() {
        return Collections.unmodifiableSet(permissions);
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
        Role role = (Role) o;
        return Objects.equals(code, role.code);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(code);
    }
    
    @Override
    public String toString() {
        return "Role{code='" + code + "', isSystem=" + isSystem + ", permissions=" + permissions.size() + "}";
    }
}
