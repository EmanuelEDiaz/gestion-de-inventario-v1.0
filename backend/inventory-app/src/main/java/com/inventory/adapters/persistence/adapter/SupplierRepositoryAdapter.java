package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.entity.SupplierEntity;
import com.inventory.adapters.persistence.adapter.mapper.CatalogPersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.SupplierR2dbcRepository;
import com.inventory.domain.model.supplier.Supplier;
import com.inventory.domain.ports.out.SupplierRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class SupplierRepositoryAdapter implements SupplierRepository {

    private final SupplierR2dbcRepository r2dbcRepository;
    private final CatalogPersistenceMapper mapper;

    public SupplierRepositoryAdapter(SupplierR2dbcRepository r2dbcRepository,
                                      CatalogPersistenceMapper mapper) {
        this.r2dbcRepository = r2dbcRepository;
        this.mapper = mapper;
    }

    @Override
    public Mono<Supplier> findById(UUID id) {
        return r2dbcRepository.findById(id)
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Supplier> findByCode(String code) {
        return r2dbcRepository.findByCode(code)
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Supplier> findAll() {
        return r2dbcRepository.findAll()
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Supplier> findAllActive() {
        return r2dbcRepository.findAllActive()
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Supplier> findByActive(boolean active) {
        return r2dbcRepository.findByActive(active)
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Supplier> search(String query) {
        return r2dbcRepository.search(query)
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Supplier> save(Supplier supplier) {
        return r2dbcRepository.findById(supplier.getId())
            .flatMap(existing -> {
                SupplierEntity entity = mapper.toEntity(supplier, false);
                return r2dbcRepository.save(entity);
            })
            .switchIfEmpty(Mono.defer(() -> {
                SupplierEntity entity = mapper.toEntity(supplier, true);
                return r2dbcRepository.save(entity);
            }))
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Boolean> existsByCode(String code) {
        return r2dbcRepository.existsByCode(code);
    }

    @Override
    public Mono<Boolean> existsByName(String name) {
        return r2dbcRepository.existsByName(name);
    }

    @Override
    public Mono<Void> deleteById(UUID id) {
        return r2dbcRepository.deleteById(id);
    }
}
