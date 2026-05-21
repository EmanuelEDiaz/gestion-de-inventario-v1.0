package com.inventory.application.usecase.command;

import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.model.customer.CustomerDebt;
import com.inventory.domain.model.sale.Sale;
import com.inventory.domain.ports.in.SaleCommandPort;
import com.inventory.domain.ports.out.CustomerDebtRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: venta en modo CREDIT (fiado).
 * Flujo: crear borrador → confirmar (reserva stock) → entregar (mueve stock) → crear deuda.
 */
@Service
public class CreditSaleUseCase {

    private final SaleCommandPort saleCommandPort;
    private final CustomerDebtRepository customerDebtRepository;

    public CreditSaleUseCase(SaleCommandPort saleCommandPort,
                              CustomerDebtRepository customerDebtRepository) {
        this.saleCommandPort = saleCommandPort;
        this.customerDebtRepository = customerDebtRepository;
    }

    @Transactional
    public Mono<CreditSaleResult> execute(SaleCommandPort.CreateCommand baseCommand, UUID createdBy) {
        if (baseCommand.customerId() == null) {
            return Mono.error(new BadRequestException("customerId is required for credit sales"));
        }

        SaleCommandPort.CreateCommand creditCommand = new SaleCommandPort.CreateCommand(
            baseCommand.warehouseId(),
            baseCommand.customerId(),
            baseCommand.currencyCode(),
            baseCommand.notes(),
            baseCommand.saleDate(),
            baseCommand.lines(),
            Sale.PaymentMode.CREDIT
        );

        return saleCommandPort.create(creditCommand, createdBy)
            .flatMap(draft -> saleCommandPort.confirm(draft.id()))
            .flatMap(confirmed -> saleCommandPort.deliver(confirmed.id()))
            .flatMap(delivered -> {
                CustomerDebt debt = CustomerDebt.create(
                    delivered.customerId(),
                    delivered.id(),
                    delivered.total(),
                    delivered.currencyCode()
                );
                return customerDebtRepository.save(debt)
                    .map(savedDebt -> new CreditSaleResult(delivered, savedDebt));
            });
    }

    public record CreditSaleResult(Sale sale, CustomerDebt debt) {}
}
