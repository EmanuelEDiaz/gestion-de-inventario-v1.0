package com.inventory.domain.ports.in;

import com.inventory.domain.model.CustomerDebt;
import com.inventory.domain.model.DebtPayment;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Puerto de entrada para comandos sobre deudas de cliente.
 */
public interface CustomerDebtCommandPort {

    Mono<DebtPayment> registerPayment(RegisterPaymentCommand command);

    Mono<CustomerDebt> update(UUID debtId, UpdateCommand command);

    Mono<CustomerDebt> cancel(UUID debtId);

    record RegisterPaymentCommand(
        UUID debtId,
        BigDecimal amount,
        DebtPayment.PaymentMethod paymentMethod,
        String notes,
        UUID registeredBy
    ) {}

    record UpdateCommand(
        String description,
        Instant dueDate,
        String notes
    ) {}
}
