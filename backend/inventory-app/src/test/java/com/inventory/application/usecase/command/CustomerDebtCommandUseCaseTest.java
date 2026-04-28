package com.inventory.application.usecase.command;

import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.CustomerDebt;
import com.inventory.domain.model.DebtPayment;
import com.inventory.domain.ports.in.CustomerDebtCommandPort;
import com.inventory.domain.ports.out.CustomerDebtRepository;
import com.inventory.domain.ports.out.DebtPaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.junit.jupiter.api.Assertions;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerDebtCommandUseCaseTest {

    @Mock
    private CustomerDebtRepository customerDebtRepository;

    @Mock
    private DebtPaymentRepository debtPaymentRepository;

    private CustomerDebtCommandUseCase useCase;

    private final UUID customerId = UUID.randomUUID();
    private final UUID saleId     = UUID.randomUUID();
    private final UUID debtId     = UUID.randomUUID();
    private final UUID userId     = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        useCase = new CustomerDebtCommandUseCase(customerDebtRepository, debtPaymentRepository);
    }

    @Test
    void registerPayment_shouldUpdateDebtAndCreatePayment() {
        // Arrange
        CustomerDebt debt = CustomerDebt.create(customerId, saleId, new BigDecimal("100.00"), "USD");
        var command = new CustomerDebtCommandPort.RegisterPaymentCommand(
            debtId, new BigDecimal("50.00"), DebtPayment.PaymentMethod.CASH, "abono", userId
        );
        DebtPayment payment = DebtPayment.create(debtId, new BigDecimal("50.00"),
            DebtPayment.PaymentMethod.CASH, "abono", userId);

        when(customerDebtRepository.findById(debtId)).thenReturn(Mono.just(debt));
        when(customerDebtRepository.save(any())).thenReturn(Mono.just(debt));
        when(debtPaymentRepository.save(any())).thenReturn(Mono.just(payment));

        // Act & Assert
        StepVerifier.create(useCase.registerPayment(command))
            .assertNext(p -> {
                assert p.debtId().equals(debtId);
                assert p.amount().compareTo(new BigDecimal("50.00")) == 0;
            })
            .verifyComplete();
    }

    @Test
    void registerPayment_shouldThrowNotFoundWhenDebtMissing() {
        // Arrange
        var command = new CustomerDebtCommandPort.RegisterPaymentCommand(
            debtId, new BigDecimal("50.00"), DebtPayment.PaymentMethod.CASH, null, userId
        );
        when(customerDebtRepository.findById(debtId)).thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(useCase.registerPayment(command))
            .expectError(NotFoundException.class)
            .verify();
    }

    @Test
    void cancel_shouldMarkDebtCancelled() {
        // Arrange
        CustomerDebt debt = CustomerDebt.create(customerId, saleId, new BigDecimal("200.00"), "PEN");
        when(customerDebtRepository.findById(debtId)).thenReturn(Mono.just(debt));
        when(customerDebtRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        // Act & Assert
        StepVerifier.create(useCase.cancel(debtId))
            .assertNext(d -> Assertions.assertEquals(CustomerDebt.DebtStatus.CANCELLED, d.getStatus()))
            .verifyComplete();
    }

    @Test
    void cancel_shouldThrowNotFoundWhenDebtMissing() {
        // Arrange
        when(customerDebtRepository.findById(debtId)).thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(useCase.cancel(debtId))
            .expectError(NotFoundException.class)
            .verify();
    }
}
