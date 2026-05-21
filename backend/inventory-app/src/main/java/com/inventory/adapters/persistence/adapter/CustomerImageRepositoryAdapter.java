package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.mapper.SupplementaryPersistenceMapper;
import com.inventory.adapters.persistence.repository.R2dbcCustomerImageRepository;
import com.inventory.domain.model.customer.CustomerImage;
import com.inventory.domain.ports.out.CustomerImageRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class CustomerImageRepositoryAdapter implements CustomerImageRepository {

    private final R2dbcCustomerImageRepository r2dbc;
    private final SupplementaryPersistenceMapper mapper;

    public CustomerImageRepositoryAdapter(R2dbcCustomerImageRepository r2dbc,
                                           SupplementaryPersistenceMapper mapper) {
        this.r2dbc = r2dbc;
        this.mapper = mapper;
    }

    @Override
    public Flux<CustomerImage> findByCustomerId(UUID customerId) {
        return r2dbc.findByCustomerId(customerId).map(mapper::toDomain);
    }

    @Override
    public Mono<CustomerImage> findById(UUID id) {
        return r2dbc.findById(id).map(mapper::toDomain);
    }

    @Override
    public Mono<CustomerImage> save(CustomerImage image) {
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
    public Mono<Void> deleteByCustomerId(UUID customerId) {
        return r2dbc.deleteByCustomerId(customerId);
    }

    @Override
    public Mono<Boolean> existsById(UUID id) {
        return r2dbc.existsById(id);
    }
}
