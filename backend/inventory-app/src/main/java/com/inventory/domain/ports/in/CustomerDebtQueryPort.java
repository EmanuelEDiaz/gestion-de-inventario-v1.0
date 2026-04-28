package com.inventory.domain.ports.in;

import com.inventory.domain.model.CustomerDebt;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de entrada para consultas sobre deudas de cliente.
 */
public interface CustomerDebtQueryPort {

    Flux<CustomerDebt> listByCustomer(UUID customerId);

    Mono<CustomerDebt> getById(UUID debtId);

    Flux<CustomerDebt> listAll(CustomerDebt.DebtStatus status);

    Flux<CustomerDebt> listOverdue();
}
