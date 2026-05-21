package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.CustomerEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface CustomerR2dbcRepository extends ReactiveCrudRepository<CustomerEntity, UUID> {

    Mono<CustomerEntity> findByCode(String code);

    @Query("SELECT * FROM customers WHERE is_active = true ORDER BY name")
    Flux<CustomerEntity> findAllActive();

    @Query("SELECT * FROM customers WHERE is_active = :active ORDER BY name")
    Flux<CustomerEntity> findByActive(boolean active);

    @Query("SELECT * FROM customers WHERE LOWER(name) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(code) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY name LIMIT 50")
    Flux<CustomerEntity> search(String query);

    Mono<Boolean> existsByCode(String code);

    Mono<Boolean> existsByName(String name);
}
