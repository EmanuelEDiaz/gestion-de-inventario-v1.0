package com.inventory.application.usecase.query.customer;

import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.customer.CustomerDebt;
import com.inventory.domain.ports.in.customer.CustomerDebtQueryPort;
import com.inventory.domain.ports.out.CustomerDebtRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: consultas sobre deudas de cliente.
 */
@Service
public class CustomerDebtQueryUseCase implements CustomerDebtQueryPort {

    private final CustomerDebtRepository customerDebtRepository;

    public CustomerDebtQueryUseCase(CustomerDebtRepository customerDebtRepository) {
        this.customerDebtRepository = customerDebtRepository;
    }

    @Override
    public Flux<CustomerDebt> listByCustomer(UUID customerId) {
        return customerDebtRepository.findByCustomerId(customerId);
    }

    @Override
    public Mono<CustomerDebt> getById(UUID debtId) {
        return customerDebtRepository.findById(debtId)
            .switchIfEmpty(Mono.error(new NotFoundException("CustomerDebt not found: " + debtId)));
    }

    @Override
    public Flux<CustomerDebt> listAll(CustomerDebt.DebtStatus status) {
        return customerDebtRepository.findByStatus(status);
    }

    @Override
    public Flux<CustomerDebt> listOverdue() {
        return customerDebtRepository.findOverdue();
    }
}
