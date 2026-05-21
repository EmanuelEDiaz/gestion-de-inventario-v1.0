package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.entity.WarehouseEntity;
import com.inventory.adapters.persistence.adapter.mapper.CatalogPersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.WarehouseR2dbcRepository;
import com.inventory.domain.model.warehouse.Warehouse;
import com.inventory.domain.ports.out.WarehouseRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class WarehouseRepositoryAdapter implements WarehouseRepository {

    private final WarehouseR2dbcRepository r2dbcRepository;
    private final CatalogPersistenceMapper mapper;

    public WarehouseRepositoryAdapter(WarehouseR2dbcRepository r2dbcRepository,
                                       CatalogPersistenceMapper mapper) {
        this.r2dbcRepository = r2dbcRepository;
        this.mapper = mapper;
    }

    @Override
    public Mono<Warehouse> findById(UUID id) {
        return r2dbcRepository.findById(id)
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Warehouse> findByCode(String code) {
        return r2dbcRepository.findByCode(code)
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Warehouse> findAll() {
        return r2dbcRepository.findAll()
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Warehouse> findAllActive() {
        return r2dbcRepository.findAllActive()
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Warehouse> save(Warehouse warehouse) {
        return r2dbcRepository.findById(warehouse.getId())
            .flatMap(existing -> {
                WarehouseEntity entity = mapper.toEntity(warehouse, false);
                return r2dbcRepository.save(entity);
            })
            .switchIfEmpty(Mono.defer(() -> {
                WarehouseEntity entity = mapper.toEntity(warehouse, true);
                return r2dbcRepository.save(entity);
            }))
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Boolean> existsByCode(String code) {
        return r2dbcRepository.existsByCode(code);
    }

    @Override
    public Mono<Void> deleteById(UUID id) {
        return r2dbcRepository.deleteById(id);
    }
}
