package com.inventory.domain.ports.in;

import com.inventory.domain.model.Adjustment;
import com.inventory.domain.model.AdjustmentLine;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Puerto de entrada para comandos de ajustes de inventario.
 * Operaciones que modifican estado.
 */
public interface AdjustmentCommandPort {
    
    Mono<Adjustment> create(CreateAdjustmentCommand command);
    Mono<Adjustment> update(UpdateAdjustmentCommand command);
    Mono<Adjustment> confirm(UUID adjustmentId);
    Mono<Adjustment> cancel(UUID adjustmentId);
    Mono<Void> delete(UUID adjustmentId);

    record CreateAdjustmentCommand(
        UUID warehouseId,
        Adjustment.AdjustmentType type,
        String reason,
        String notes,
        UUID createdBy,
        List<LineCommand> lines
    ) {}

    record UpdateAdjustmentCommand(
        UUID adjustmentId,
        Adjustment.AdjustmentType type,
        String reason,
        String notes,
        List<LineCommand> lines
    ) {}

    record LineCommand(
        UUID productId,
        java.math.BigDecimal systemQty,
        java.math.BigDecimal countedQty,
        java.math.BigDecimal unitCost
    ) {}
}
