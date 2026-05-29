package com.inventory.domain.ports.out;

import com.inventory.domain.model.customer.CustomerDebt;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de salida: Repositorio de deudas de cliente.
 */
public interface CustomerDebtRepository {

    Flux<CustomerDebt> findAll();

    Mono<CustomerDebt> findById(UUID id);

    Flux<CustomerDebt> findByCustomerId(UUID customerId);

    Flux<CustomerDebt> findBySaleId(UUID saleId);

    Flux<CustomerDebt> findPendingByCustomerId(UUID customerId);

    Flux<CustomerDebt> findByStatus(CustomerDebt.DebtStatus status);

    Flux<CustomerDebt> findOverdue();

    Mono<CustomerDebt> save(CustomerDebt debt);

    Mono<Void> deleteById(UUID id);

    Mono<Boolean> existsById(UUID id);
}
