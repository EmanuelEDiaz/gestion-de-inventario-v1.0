package com.inventory.domain.ports.out;

import com.inventory.domain.model.DebtPayment;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Puerto de salida: Repositorio de pagos de deuda.
 */
public interface DebtPaymentRepository {

    Mono<DebtPayment> findById(UUID id);

    Flux<DebtPayment> findByDebtId(UUID debtId);

    Mono<DebtPayment> save(DebtPayment payment);

    Mono<Void> deleteById(UUID id);
}
