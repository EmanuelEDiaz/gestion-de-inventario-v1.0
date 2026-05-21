package com.inventory.application.usecase.command;

import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.customer.CustomerDebt;
import com.inventory.domain.model.sale.Sale;
import com.inventory.domain.ports.in.sale.SaleCommandPort;
import com.inventory.domain.ports.out.CustomerDebtRepository;
import com.inventory.domain.ports.out.SaleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: confirmar una venta RESERVE al cobrarla.
 * Flujo: entregar (mueve stock de reserved a on_hand) → crear deuda del cliente.
 */
@Service
public class ConfirmReserveSaleUseCase {

    private final SaleCommandPort saleCommandPort;
    private final SaleRepository saleRepository;
    private final CustomerDebtRepository customerDebtRepository;

    public ConfirmReserveSaleUseCase(SaleCommandPort saleCommandPort,
                                      SaleRepository saleRepository,
                                      CustomerDebtRepository customerDebtRepository) {
        this.saleCommandPort = saleCommandPort;
        this.saleRepository = saleRepository;
        this.customerDebtRepository = customerDebtRepository;
    }

    @Transactional
    public Mono<CreditSaleUseCase.CreditSaleResult> execute(UUID saleId) {
        return saleRepository.findById(saleId)
            .switchIfEmpty(Mono.error(new NotFoundException("Sale not found: " + saleId)))
            .flatMap(sale -> {
                if (sale.paymentMode() != Sale.PaymentMode.RESERVE) {
                    return Mono.error(new BadRequestException(
                        "Sale " + saleId + " is not in RESERVE mode"));
                }
                if (sale.customerId() == null) {
                    return Mono.error(new BadRequestException(
                        "Sale " + saleId + " has no associated customer"));
                }
                return saleCommandPort.deliver(saleId)
                    .flatMap(delivered -> {
                        CustomerDebt debt = CustomerDebt.create(
                            delivered.customerId(),
                            delivered.id(),
                            delivered.total(),
                            delivered.currencyCode()
                        );
                        return customerDebtRepository.save(debt)
                            .map(savedDebt -> new CreditSaleUseCase.CreditSaleResult(delivered, savedDebt));
                    });
            });
    }
}
