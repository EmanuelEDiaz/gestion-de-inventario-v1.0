package com.inventory.domain.ports.out;

import com.inventory.domain.model.User;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de salida para persistencia de usuarios.
 * Define el contrato que debe implementar el adapter de persistencia.
 */
public interface UserRepositoryPort {
    
    /**
     * Busca un usuario por su nombre de usuario.
     * Incluye el rol con todos sus permisos.
     */
    Mono<User> findByUsername(String username);
    
    /**
     * Busca un usuario por su ID.
     * Incluye el rol con todos sus permisos.
     */
    Mono<User> findById(UUID id);
    
    /**
     * Guarda un usuario (inserción o actualización).
     */
    Mono<User> save(User user);
    
    /**
     * Verifica si existe un usuario con el nombre dado.
     */
    Mono<Boolean> existsByUsername(String username);
}
