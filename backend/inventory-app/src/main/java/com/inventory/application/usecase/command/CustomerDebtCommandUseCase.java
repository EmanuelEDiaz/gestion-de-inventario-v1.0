package com.inventory.application.usecase.command;

import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.customer.CustomerDebt;
import com.inventory.domain.model.customer.DebtPayment;
import com.inventory.domain.ports.in.customer.CustomerDebtCommandPort;
import com.inventory.domain.ports.out.CustomerDebtRepository;
import com.inventory.domain.ports.out.DebtPaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: comandos sobre deudas de cliente.
 * Cubre: registrar pago, actualizar campos descriptivos y cancelar.
 */
@Service
public class CustomerDebtCommandUseCase implements CustomerDebtCommandPort {

    private final CustomerDebtRepository customerDebtRepository;
    private final DebtPaymentRepository debtPaymentRepository;

    public CustomerDebtCommandUseCase(CustomerDebtRepository customerDebtRepository,
                                       DebtPaymentRepository debtPaymentRepository) {
        this.customerDebtRepository = customerDebtRepository;
        this.debtPaymentRepository = debtPaymentRepository;
    }

    @Override
    @Transactional
    public Mono<DebtPayment> registerPayment(RegisterPaymentCommand command) {
        return customerDebtRepository.findById(command.debtId())
            .switchIfEmpty(Mono.error(new NotFoundException("CustomerDebt not found: " + command.debtId())))
            .flatMap(debt -> {
                CustomerDebt updated = debt.registerPayment(command.amount());
                DebtPayment payment = DebtPayment.create(
                    command.debtId(),
                    command.amount(),
                    command.paymentMethod(),
                    command.notes(),
                    command.registeredBy()
                );
                return customerDebtRepository.save(updated)
                    .then(debtPaymentRepository.save(payment));
            });
    }

    @Override
    public Mono<CustomerDebt> update(UUID debtId, UpdateCommand command) {
        return customerDebtRepository.findById(debtId)
            .switchIfEmpty(Mono.error(new NotFoundException("CustomerDebt not found: " + debtId)))
            .map(debt -> debt.update(command.description(), command.dueDate(), command.notes()))
            .flatMap(customerDebtRepository::save);
    }

    @Override
    public Mono<CustomerDebt> cancel(UUID debtId) {
        return customerDebtRepository.findById(debtId)
            .switchIfEmpty(Mono.error(new NotFoundException("CustomerDebt not found: " + debtId)))
            .map(CustomerDebt::cancel)
            .flatMap(customerDebtRepository::save);
    }
}
