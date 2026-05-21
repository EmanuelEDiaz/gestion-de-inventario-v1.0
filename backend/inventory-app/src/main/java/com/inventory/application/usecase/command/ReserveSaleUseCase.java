package com.inventory.application.usecase.command;

import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.model.sale.Sale;
import com.inventory.domain.ports.in.SaleCommandPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: venta en modo RESERVE (reserva stock sin cobrar).
 * Flujo: crear borrador → confirmar (reserva stock en stock_balances.reserved).
 * El stock no se mueve de on_hand hasta que se confirme el pago (ConfirmReserveSaleUseCase).
 */
@Service
public class ReserveSaleUseCase {

    private final SaleCommandPort saleCommandPort;

    public ReserveSaleUseCase(SaleCommandPort saleCommandPort) {
        this.saleCommandPort = saleCommandPort;
    }

    @Transactional
    public Mono<Sale> execute(SaleCommandPort.CreateCommand baseCommand, UUID createdBy) {
        if (baseCommand.customerId() == null) {
            return Mono.error(new BadRequestException("customerId is required for reserve sales"));
        }

        SaleCommandPort.CreateCommand reserveCommand = new SaleCommandPort.CreateCommand(
            baseCommand.warehouseId(),
            baseCommand.customerId(),
            baseCommand.currencyCode(),
            baseCommand.notes(),
            baseCommand.saleDate(),
            baseCommand.lines(),
            Sale.PaymentMode.RESERVE
        );

        return saleCommandPort.create(reserveCommand, createdBy)
            .flatMap(draft -> saleCommandPort.confirm(draft.id()));
    }
}
