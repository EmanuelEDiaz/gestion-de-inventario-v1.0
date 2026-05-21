package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.SupplierEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface SupplierR2dbcRepository extends ReactiveCrudRepository<SupplierEntity, UUID> {

    Mono<SupplierEntity> findByCode(String code);

    @Query("SELECT * FROM suppliers WHERE is_active = true ORDER BY name")
    Flux<SupplierEntity> findAllActive();

    @Query("SELECT * FROM suppliers WHERE is_active = :active ORDER BY name")
    Flux<SupplierEntity> findByActive(boolean active);

    @Query("SELECT * FROM suppliers WHERE LOWER(name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(code) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY name LIMIT 50")
    Flux<SupplierEntity> search(String query);

    Mono<Boolean> existsByCode(String code);

    Mono<Boolean> existsByName(String name);
}
