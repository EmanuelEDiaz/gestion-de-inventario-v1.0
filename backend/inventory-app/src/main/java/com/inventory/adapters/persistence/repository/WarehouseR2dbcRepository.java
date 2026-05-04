package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.WarehouseEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface WarehouseR2dbcRepository extends ReactiveCrudRepository<WarehouseEntity, UUID> {

    Mono<WarehouseEntity> findByCode(String code);

    @Query("SELECT * FROM warehouses WHERE is_active = true ORDER BY name")
    Flux<WarehouseEntity> findAllActive();

    Mono<Boolean> existsByCode(String code);
}
