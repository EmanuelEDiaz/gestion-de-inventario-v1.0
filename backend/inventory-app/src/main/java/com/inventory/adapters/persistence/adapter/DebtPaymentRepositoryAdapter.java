package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.mapper.SupplementaryPersistenceMapper;
import com.inventory.adapters.persistence.repository.R2dbcDebtPaymentRepository;
import com.inventory.domain.model.DebtPayment;
import com.inventory.domain.ports.out.DebtPaymentRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class DebtPaymentRepositoryAdapter implements DebtPaymentRepository {

    private final R2dbcDebtPaymentRepository r2dbc;
    private final SupplementaryPersistenceMapper mapper;

    public DebtPaymentRepositoryAdapter(R2dbcDebtPaymentRepository r2dbc,
                                         SupplementaryPersistenceMapper mapper) {
        this.r2dbc = r2dbc;
        this.mapper = mapper;
    }

    @Override
    public Mono<DebtPayment> findById(UUID id) {
        return r2dbc.findById(id).map(mapper::toDomain);
    }

    @Override
    public Flux<DebtPayment> findByDebtId(UUID debtId) {
        return r2dbc.findByDebtId(debtId).map(mapper::toDomain);
    }

    @Override
    public Mono<DebtPayment> save(DebtPayment payment) {
        return r2dbc.findById(payment.id())
            .flatMap(existing -> r2dbc.save(mapper.toEntity(payment, false)))
            .switchIfEmpty(Mono.defer(() -> r2dbc.save(mapper.toEntity(payment, true))))
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Void> deleteById(UUID id) {
        return r2dbc.deleteById(id);
    }
}
