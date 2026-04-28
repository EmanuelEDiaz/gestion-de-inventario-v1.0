package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.mapper.SupplementaryPersistenceMapper;
import com.inventory.adapters.persistence.repository.R2dbcSupplierImageRepository;
import com.inventory.domain.model.SupplierImage;
import com.inventory.domain.ports.out.SupplierImageRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class SupplierImageRepositoryAdapter implements SupplierImageRepository {

    private final R2dbcSupplierImageRepository r2dbc;
    private final SupplementaryPersistenceMapper mapper;

    public SupplierImageRepositoryAdapter(R2dbcSupplierImageRepository r2dbc,
                                           SupplementaryPersistenceMapper mapper) {
        this.r2dbc = r2dbc;
        this.mapper = mapper;
    }

    @Override
    public Flux<SupplierImage> findBySupplierId(UUID supplierId) {
        return r2dbc.findBySupplierId(supplierId).map(mapper::toDomain);
    }

    @Override
    public Mono<SupplierImage> findById(UUID id) {
        return r2dbc.findById(id).map(mapper::toDomain);
    }

    @Override
    public Mono<SupplierImage> save(SupplierImage image) {
        return r2dbc.findById(image.id())
            .flatMap(existing -> r2dbc.save(mapper.toEntity(image, false)))
            .switchIfEmpty(Mono.defer(() -> r2dbc.save(mapper.toEntity(image, true))))
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Void> deleteById(UUID id) {
        return r2dbc.deleteById(id);
    }

    @Override
    public Mono<Void> deleteBySupplierId(UUID supplierId) {
        return r2dbc.deleteBySupplierId(supplierId);
    }

    @Override
    public Mono<Boolean> existsById(UUID id) {
        return r2dbc.existsById(id);
    }
}
