package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.RoleEntity;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Repositorio R2DBC para roles.
 */
@Repository
public interface RoleR2dbcRepository extends R2dbcRepository<RoleEntity, UUID> {
    
    Mono<RoleEntity> findByCode(String code);
    
    Flux<RoleEntity> findByIsActiveTrue();
    
    Mono<Boolean> existsByCode(String code);

    Mono<Boolean> existsByCodeAndIsActiveTrue(String code);
}
