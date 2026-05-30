package com.inventory.application.usecase.command.adjustment;

import com.inventory.domain.model.adjustment.Adjustment;
import com.inventory.domain.model.adjustment.AdjustmentLine;
import com.inventory.domain.model.stock.InventoryMovement;
import com.inventory.domain.ports.in.adjustment.AdjustmentCommandPort;
import com.inventory.domain.ports.out.AdjustmentRepository;
import com.inventory.domain.ports.out.StockRepository;
import com.inventory.domain.ports.out.MovementRepository;
import com.inventory.domain.ports.out.SyncLogWriterPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Caso de uso: Comandos de ajustes de inventario.
 * Gestiona creación, actualización, confirmación y cancelación.
 */
@Service
public class AdjustmentCommandUseCase implements AdjustmentCommandPort {

    private final AdjustmentRepository adjustmentRepository;
    private final StockRepository stockRepository;
    private final MovementRepository movementRepository;
    private final SyncLogWriterPort syncLogWriter;

    public AdjustmentCommandUseCase(AdjustmentRepository adjustmentRepository,
                                     StockRepository stockRepository,
                                     MovementRepository movementRepository,
                                     SyncLogWriterPort syncLogWriter) {
        this.adjustmentRepository = adjustmentRepository;
        this.stockRepository = stockRepository;
        this.movementRepository = movementRepository;
        this.syncLogWriter = syncLogWriter;
    }

    @Override
    public Mono<Adjustment> create(CreateAdjustmentCommand command) {
        return adjustmentRepository.generateAdjustmentNumber()
                .map(number -> buildAdjustment(number, command))
                .flatMap(adj -> adjustmentRepository.save(adj)
                        .flatMap(saved -> syncLogWriter.log("ADJUSTMENT", saved.getId(), "CREATE", saved, null)
                                .thenReturn(saved)));
    }

    @Override
    public Mono<Adjustment> update(UpdateAdjustmentCommand command) {
        return adjustmentRepository.findById(command.adjustmentId())
                .flatMap(adjustment -> {
                    if (!adjustment.canModify()) {
                        return Mono.error(new IllegalStateException("Cannot modify confirmed or cancelled adjustment"));
                    }
                    var updated = rebuildWithUpdates(adjustment, command);
                    return adjustmentRepository.deleteLinesByAdjustmentId(adjustment.getId())
                            .then(adjustmentRepository.save(updated));
                });
    }

    @Override
    public Mono<Adjustment> confirm(UUID adjustmentId) {
        return adjustmentRepository.findById(adjustmentId)
                .flatMap(adjustment -> {
                    var confirmed = adjustment.confirm();
                    return applyStockAdjustments(confirmed)
                            .then(adjustmentRepository.save(confirmed));
                });
    }

    @Override
    public Mono<Adjustment> cancel(UUID adjustmentId) {
        return adjustmentRepository.findById(adjustmentId)
                .flatMap(adjustment -> {
                    var cancelled = adjustment.cancel();
                    return adjustmentRepository.save(cancelled);
                });
    }

    @Override
    public Mono<Void> delete(UUID adjustmentId) {
        return adjustmentRepository.findById(adjustmentId)
                .flatMap(adjustment -> {
                    if (!adjustment.canDelete()) {
                        return Mono.error(new IllegalStateException("Cannot delete confirmed adjustment"));
                    }
                    return adjustmentRepository.deleteLinesByAdjustmentId(adjustmentId)
                            .then(adjustmentRepository.deleteById(adjustmentId));
                });
    }

    @Override
    public Mono<Void> deleteAll(List<UUID> ids) {
        if (ids.isEmpty()) return Mono.empty();
        return Flux.fromIterable(ids)
                .flatMap(id -> adjustmentRepository.findById(id)
                        .flatMap(adjustment -> {
                            if (!adjustment.canDelete()) {
                                return Mono.error(new IllegalStateException("Cannot delete confirmed adjustment"));
                            }
                            return Mono.just(id);
                        }))
                .then(adjustmentRepository.deleteAllById(ids));
    }

    private Adjustment buildAdjustment(String number, CreateAdjustmentCommand cmd) {
        var counter = new AtomicInteger(0);
        var lines = cmd.lines().stream()
                .map(l -> AdjustmentLine.create(l.productId(), l.systemQty(), l.countedQty(),
                        l.unitCost(), counter.incrementAndGet()))
                .collect(Collectors.toList());
        return Adjustment.create(number, cmd.warehouseId(), cmd.type(), cmd.reason(), cmd.createdBy(), lines);
    }

    private Adjustment rebuildWithUpdates(Adjustment adjustment, UpdateAdjustmentCommand cmd) {
        var counter = new AtomicInteger(0);
        var lines = cmd.lines().stream()
                .map(l -> AdjustmentLine.create(l.productId(), l.systemQty(), l.countedQty(),
                        l.unitCost(), counter.incrementAndGet()))
                .collect(Collectors.toList());
        return new Adjustment(
                adjustment.getId(), adjustment.getAdjustmentNumber(), adjustment.getWarehouseId(),
                cmd.type(), adjustment.getStatus(), cmd.reason(), cmd.notes(),
                adjustment.getAdjustmentDate(), adjustment.getCreatedBy(),
                adjustment.getCreatedAt(), null, lines
        );
    }

    private Mono<Void> applyStockAdjustments(Adjustment adjustment) {
        return Flux.fromIterable(adjustment.getLines())
                .flatMap(line -> applyLineDifference(adjustment, line))
                .then();
    }

    private Mono<Void> applyLineDifference(Adjustment adjustment, AdjustmentLine line) {
        if (line.isZero()) {
            return Mono.empty();
        }

        var quantity = line.getDifference().abs();

        var stockUpdate = line.isIncrease()
                ? stockRepository.addStock(line.getProductId(), adjustment.getWarehouseId(), quantity, line.getUnitCost())
                : stockRepository.removeStock(line.getProductId(), adjustment.getWarehouseId(), quantity);

        var movement = InventoryMovement.adjustment(
                adjustment.getWarehouseId(),
                line.getProductId(),
                quantity,
                line.isIncrease(),
                adjustment.getId(),
                null,
                adjustment.getReason(),
                adjustment.getCreatedBy()
        );

        return stockUpdate.then(movementRepository.save(movement)).then();
    }
}
