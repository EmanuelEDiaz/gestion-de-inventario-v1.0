package com.inventory.domain.ports.in.returns;

import com.inventory.domain.model.returns.Return;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Puerto de entrada para comandos de devoluciones.
 */
public interface ReturnCommandPort {
    
    Mono<Return> create(CreateReturnCommand command);
    Mono<Return> update(UpdateReturnCommand command);
    Mono<Return> confirm(UUID returnId);
    Mono<Return> cancel(UUID returnId);
    Mono<Void> delete(UUID returnId);
    Mono<Void> deleteAll(List<UUID> ids);

    record CreateReturnCommand(
        Return.ReturnType type,
        UUID warehouseId,
        UUID originalDocumentId,
        String reason,
        String notes,
        UUID createdBy,
        List<LineCommand> lines
    ) {}

    record UpdateReturnCommand(
        UUID returnId,
        String reason,
        String notes,
        List<LineCommand> lines
    ) {}

    record LineCommand(
        UUID productId,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal unitCost
    ) {}
}
