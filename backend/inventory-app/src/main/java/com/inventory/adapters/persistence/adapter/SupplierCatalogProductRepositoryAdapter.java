package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.mapper.SupplementaryPersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.R2dbcSupplierCatalogProductRepository;
import com.inventory.domain.model.supplier.SupplierCatalogProduct;
import com.inventory.domain.ports.out.SupplierCatalogProductRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class SupplierCatalogProductRepositoryAdapter implements SupplierCatalogProductRepository {

    private final R2dbcSupplierCatalogProductRepository r2dbc;
    private final SupplementaryPersistenceMapper mapper;

    public SupplierCatalogProductRepositoryAdapter(R2dbcSupplierCatalogProductRepository r2dbc,
                                                    SupplementaryPersistenceMapper mapper) {
        this.r2dbc = r2dbc;
        this.mapper = mapper;
    }

    @Override
    public Flux<SupplierCatalogProduct> findBySupplierId(UUID supplierId) {
        return r2dbc.findBySupplierId(supplierId).map(mapper::toDomain);
    }

    @Override
    public Flux<SupplierCatalogProduct> findByProductId(UUID productId) {
        return r2dbc.findByProductId(productId).map(mapper::toDomain);
    }

    @Override
    public Mono<SupplierCatalogProduct> findById(UUID id) {
        return r2dbc.findById(id).map(mapper::toDomain);
    }

    @Override
    public Mono<SupplierCatalogProduct> save(SupplierCatalogProduct catalogProduct) {
        return r2dbc.findById(catalogProduct.id())
            .flatMap(existing -> r2dbc.save(mapper.toEntity(catalogProduct, false)))
            .switchIfEmpty(Mono.defer(() -> r2dbc.save(mapper.toEntity(catalogProduct, true))))
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
}
