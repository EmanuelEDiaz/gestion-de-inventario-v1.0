package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.mapper.SupplementaryPersistenceMapper;
import com.inventory.adapters.persistence.repository.R2dbcSupplierSocialLinkRepository;
import com.inventory.domain.model.SupplierSocialLink;
import com.inventory.domain.ports.out.SupplierSocialLinkRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class SupplierSocialLinkRepositoryAdapter implements SupplierSocialLinkRepository {

    private final R2dbcSupplierSocialLinkRepository r2dbc;
    private final SupplementaryPersistenceMapper mapper;

    public SupplierSocialLinkRepositoryAdapter(R2dbcSupplierSocialLinkRepository r2dbc,
                                                SupplementaryPersistenceMapper mapper) {
        this.r2dbc = r2dbc;
        this.mapper = mapper;
    }

    @Override
    public Flux<SupplierSocialLink> findBySupplierId(UUID supplierId) {
        return r2dbc.findBySupplierId(supplierId).map(mapper::toDomain);
    }

    @Override
    public Mono<SupplierSocialLink> findById(UUID id) {
        return r2dbc.findById(id).map(mapper::toDomain);
    }

    @Override
    public Mono<SupplierSocialLink> save(SupplierSocialLink link) {
        return r2dbc.findById(link.id())
            .flatMap(existing -> r2dbc.save(mapper.toEntity(link, false)))
            .switchIfEmpty(Mono.defer(() -> r2dbc.save(mapper.toEntity(link, true))))
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
