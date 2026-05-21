package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.entity.CustomerEntity;
import com.inventory.adapters.persistence.adapter.mapper.CatalogPersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.CustomerR2dbcRepository;
import com.inventory.domain.model.customer.Customer;
import com.inventory.domain.ports.out.CustomerRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class CustomerRepositoryAdapter implements CustomerRepository {

    private final CustomerR2dbcRepository r2dbcRepository;
    private final CatalogPersistenceMapper mapper;

    public CustomerRepositoryAdapter(CustomerR2dbcRepository r2dbcRepository,
                                      CatalogPersistenceMapper mapper) {
        this.r2dbcRepository = r2dbcRepository;
        this.mapper = mapper;
    }

    @Override
    public Mono<Customer> findById(UUID id) {
        return r2dbcRepository.findById(id)
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Customer> findByCode(String code) {
        return r2dbcRepository.findByCode(code)
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Customer> findAll() {
        return r2dbcRepository.findAll()
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Customer> findAllActive() {
        return r2dbcRepository.findAllActive()
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Customer> findByActive(boolean active) {
        return r2dbcRepository.findByActive(active)
            .map(mapper::toDomain);
    }

    @Override
    public Flux<Customer> search(String query) {
        return r2dbcRepository.search(query)
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Customer> save(Customer customer) {
        return r2dbcRepository.findById(customer.getId())
            .flatMap(existing -> {
                CustomerEntity entity = mapper.toEntity(customer, false);
                return r2dbcRepository.save(entity);
            })
            .switchIfEmpty(Mono.defer(() -> {
                CustomerEntity entity = mapper.toEntity(customer, true);
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
