package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.entity.CustomerDebtEntity;
import com.inventory.adapters.persistence.adapter.mapper.SupplementaryPersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.R2dbcCustomerDebtRepository;
import com.inventory.domain.model.customer.CustomerDebt;
import com.inventory.domain.ports.out.CustomerDebtRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

@Repository
public class CustomerDebtRepositoryAdapter implements CustomerDebtRepository {

    private final R2dbcCustomerDebtRepository r2dbc;
    private final SupplementaryPersistenceMapper mapper;

    public CustomerDebtRepositoryAdapter(R2dbcCustomerDebtRepository r2dbc,
                                          SupplementaryPersistenceMapper mapper) {
        this.r2dbc = r2dbc;
        this.mapper = mapper;
    }

    @Override
    public Flux<CustomerDebt> findAll() {
        return r2dbc.findAll().map(mapper::toDomain);
    }

    @Override
    public Mono<CustomerDebt> findById(UUID id) {
        return r2dbc.findById(id).map(mapper::toDomain);
    }

    @Override
    public Flux<CustomerDebt> findByCustomerId(UUID customerId) {
        return r2dbc.findByCustomerId(customerId).map(mapper::toDomain);
    }

    @Override
    public Flux<CustomerDebt> findBySaleId(UUID saleId) {
        return r2dbc.findBySaleId(saleId).map(mapper::toDomain);
    }

    @Override
    public Flux<CustomerDebt> findPendingByCustomerId(UUID customerId) {
        return r2dbc.findPendingByCustomerId(customerId).map(mapper::toDomain);
    }

    @Override
    public Flux<CustomerDebt> findByStatus(CustomerDebt.DebtStatus status) {
        return r2dbc.findByStatus(status.name()).map(mapper::toDomain);
    }

    @Override
    public Flux<CustomerDebt> findOverdue() {
        return r2dbc.findOverdue(Instant.now()).map(mapper::toDomain);
    }

    @Override
    public Mono<CustomerDebt> save(CustomerDebt debt) {
        return r2dbc.findById(debt.getId())
            .flatMap(existing -> r2dbc.save(mapper.toEntity(debt, false)))
            .switchIfEmpty(Mono.defer(() -> r2dbc.save(mapper.toEntity(debt, true))))
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
}
