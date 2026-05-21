package com.inventory.domain.ports.out;

import com.inventory.domain.model.role.Role;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;
import java.util.UUID;

/**
 * Puerto de salida para persistencia de roles.
 * Define el contrato que debe implementar el adapter de persistencia.
 */
public interface RoleRepositoryPort {
    
    /**
     * Busca un rol por su ID incluyendo todos sus permisos.
     */
    Mono<Role> findById(UUID id);
    
    /**
     * Busca un rol por su código incluyendo todos sus permisos.
     */
    Mono<Role> findByCode(String code);
    
    /**
     * Obtiene todos los roles activos con sus permisos.
     */
    Flux<Role> findAllActive();
    
    /**
     * Guarda un rol (inserción o actualización).
     */
    Mono<Role> save(Role role);

    /**
     * Reemplaza todos los permisos de un rol con los nuevos.
     */
    Mono<Role> saveWithPermissions(Role role, Set<UUID> permissionIds);

    /**
     * Verifica si existe un rol con el código dado.
     */
    Mono<Boolean> existsByCode(String code);
}
