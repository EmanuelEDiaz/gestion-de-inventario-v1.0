package com.inventory.adapters.persistence.mapper;

import com.inventory.adapters.persistence.entity.PermissionEntity;
import com.inventory.adapters.persistence.entity.RefreshTokenEntity;
import com.inventory.adapters.persistence.entity.RoleEntity;
import com.inventory.adapters.persistence.entity.UserEntity;
import com.inventory.domain.model.Permission;
import com.inventory.domain.model.RefreshToken;
import com.inventory.domain.model.Role;
import com.inventory.domain.model.User;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

/**
 * Mapper manual entre entidades de persistencia y modelos de dominio.
 * Usado debido a las limitaciones de R2DBC con relaciones.
 */
@Component
public class PersistenceMapper {
    
    // ==================== Permission ====================
    
    public Permission toDomain(PermissionEntity entity) {
        if (entity == null) return null;
        return new Permission(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getCategory(),
                entity.getCreatedAt()
        );
    }
    
    public PermissionEntity toEntity(Permission domain) {
        if (domain == null) return null;
        return new PermissionEntity(
                domain.getId(),
                domain.getCode(),
                domain.getName(),
                domain.getCategory(),
                domain.getCreatedAt()
        );
    }
    
    public Set<Permission> toPermissionDomainSet(Set<PermissionEntity> entities) {
        if (entities == null) return Set.of();
        return entities.stream()
                .map(this::toDomain)
                .collect(Collectors.toSet());
    }
    
    // ==================== Role ====================
    
    public Role toDomain(RoleEntity entity) {
        if (entity == null) return null;
        return new Role(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getDescription(),
                entity.isSystem(),
                entity.isActive(),
                toPermissionDomainSet(entity.getPermissions()),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
    
    public RoleEntity toEntity(Role domain) {
        if (domain == null) return null;
        RoleEntity entity = new RoleEntity(
                domain.getId(),
                domain.getCode(),
                domain.getName(),
                domain.getDescription(),
                domain.isSystem(),
                domain.isActive(),
                domain.getCreatedAt(),
                domain.getUpdatedAt()
        );
        // Los permisos se manejan por separado debido a la tabla many-to-many
        return entity;
    }
    
    // ==================== User ====================
    
    public User toDomain(UserEntity entity, Role role) {
        if (entity == null) return null;
        return new User(
                entity.getId(),
                entity.getUsername(),
                entity.getPasswordHash(),
                entity.getDisplayName(),
                entity.getEmail(),
                role,
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
    
    public UserEntity toEntity(User domain) {
        if (domain == null) return null;
        return new UserEntity(
                domain.getId(),
                domain.getUsername(),
                domain.getPasswordHash(),
                domain.getDisplayName(),
                domain.getEmail(),
                domain.getRole() != null ? domain.getRole().getId() : null,
                domain.isActive(),
                domain.getCreatedAt(),
                domain.getUpdatedAt()
        );
    }
    
    // ==================== RefreshToken ====================
    
    public RefreshToken toDomain(RefreshTokenEntity entity) {
        if (entity == null) return null;
        return new RefreshToken(
                entity.getId(),
                entity.getUserId(),
                entity.getTokenHash(),
                entity.getExpiresAt(),
                entity.getRevokedAt(),
                entity.getCreatedAt()
        );
    }
    
    public RefreshTokenEntity toEntity(RefreshToken domain) {
        return toEntity(domain, true);  // Default to new for safety
    }
    
    public RefreshTokenEntity toEntity(RefreshToken domain, boolean isNew) {
        if (domain == null) return null;
        RefreshTokenEntity entity = new RefreshTokenEntity(
                domain.getId(),
                domain.getUserId(),
                domain.getTokenHash(),
                domain.getExpiresAt(),
                domain.getRevokedAt(),
                domain.getCreatedAt()
        );
        entity.setNew(isNew);
        return entity;
    }
}
