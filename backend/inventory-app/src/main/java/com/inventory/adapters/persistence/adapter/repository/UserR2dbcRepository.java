package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.UserEntity;
import org.springframework.data.r2dbc.repository.Modifying;
import org.springframework.data.r2dbc.repository.Query;
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

    Mono<Boolean> existsByEmail(String email);

    @Modifying
    @Query("UPDATE users SET preferences = :preferences, updated_at = NOW() WHERE id = :userId")
    Mono<Integer> updatePreferences(UUID userId, String preferences);
}
