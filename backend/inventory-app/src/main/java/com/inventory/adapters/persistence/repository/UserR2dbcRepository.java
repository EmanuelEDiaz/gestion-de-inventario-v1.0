package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.UserEntity;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Repositorio R2DBC para usuarios.
 */
@Repository
public interface UserR2dbcRepository extends R2dbcRepository<UserEntity, UUID> {
    
    Mono<UserEntity> findByUsername(String username);
    
    Mono<Boolean> existsByUsername(String username);
}
