package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.PermissionEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

import java.util.UUID;

/**
 * Repositorio R2DBC para permisos.
 */
@Repository
public interface PermissionR2dbcRepository extends R2dbcRepository<PermissionEntity, UUID> {
    
    /**
     * Obtiene todos los permisos de un rol.
     */
    @Query("""
        SELECT p.* FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = :roleId
        ORDER BY p.category, p.code
        """)
    Flux<PermissionEntity> findByRoleId(UUID roleId);
}
