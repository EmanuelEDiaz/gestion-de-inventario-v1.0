package com.inventory.domain.ports.in;

import com.inventory.domain.model.Transfer;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Puerto de entrada: Comandos de Transferencias.
 * Define las operaciones de escritura (clean-code: SRP por comando).
 */
public interface TransferCommandPort {

    Mono<Transfer> create(CreateTransferCommand command);
    Mono<Transfer> update(UUID id, UpdateTransferCommand command);
    Mono<Transfer> confirm(UUID id);
    Mono<Transfer> ship(UUID id);
    Mono<Transfer> complete(UUID id, LocalDate receivedDate);
    Mono<Transfer> cancel(UUID id);
    Mono<Void> delete(UUID id);

    record CreateTransferCommand(
        UUID fromWarehouseId,
        UUID toWarehouseId,
        String notes,
        LocalDate transferDate,
        List<LineItem> lines,
        UUID createdBy
    ) {
        public record LineItem(UUID productId, BigDecimal quantity) {}
    }

    record UpdateTransferCommand(
        UUID fromWarehouseId,
        UUID toWarehouseId,
        String notes,
        LocalDate transferDate,
        List<CreateTransferCommand.LineItem> lines
    ) {}
}
