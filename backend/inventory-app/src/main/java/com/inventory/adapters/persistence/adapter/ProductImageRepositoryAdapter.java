package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.mapper.SupplementaryPersistenceMapper;
import com.inventory.adapters.persistence.repository.R2dbcProductImageRepository;
import com.inventory.domain.model.ProductImage;
import com.inventory.domain.ports.out.ProductImageRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class ProductImageRepositoryAdapter implements ProductImageRepository {

    private final R2dbcProductImageRepository r2dbc;
    private final SupplementaryPersistenceMapper mapper;

    public ProductImageRepositoryAdapter(R2dbcProductImageRepository r2dbc,
                                          SupplementaryPersistenceMapper mapper) {
        this.r2dbc = r2dbc;
        this.mapper = mapper;
    }

    @Override
    public Flux<ProductImage> findByProductId(UUID productId) {
        return r2dbc.findByProductId(productId).map(mapper::toDomain);
    }

    @Override
    public Mono<ProductImage> findById(UUID id) {
        return r2dbc.findById(id).map(mapper::toDomain);
    }

    @Override
    public Mono<ProductImage> save(ProductImage image) {
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
    public Mono<Boolean> existsById(UUID id) {
        return r2dbc.existsById(id);
    }

    @Override
    public Mono<Long> countByProductId(UUID productId) {
        return r2dbc.countByProductId(productId);
    }
}