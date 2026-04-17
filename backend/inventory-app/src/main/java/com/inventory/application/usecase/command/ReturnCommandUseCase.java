package com.inventory.application.usecase.command;

import com.inventory.domain.model.InventoryMovement;
import com.inventory.domain.model.Return;
import com.inventory.domain.model.ReturnLine;
import com.inventory.domain.ports.in.ReturnCommandPort;
import com.inventory.domain.ports.out.MovementRepository;
import com.inventory.domain.ports.out.ReturnRepository;
import com.inventory.domain.ports.out.StockRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Caso de uso: Comandos de devoluciones.
 */
@Service
public class ReturnCommandUseCase implements ReturnCommandPort {

    private final ReturnRepository returnRepository;
    private final StockRepository stockRepository;
    private final MovementRepository movementRepository;

    public ReturnCommandUseCase(ReturnRepository returnRepository,
                                 StockRepository stockRepository,
                                 MovementRepository movementRepository) {
        this.returnRepository = returnRepository;
        this.stockRepository = stockRepository;
        this.movementRepository = movementRepository;
    }

    @Override
    public Mono<Return> create(CreateReturnCommand command) {
        return returnRepository.generateReturnNumber(command.type())
                .map(number -> buildReturn(number, command))
                .flatMap(returnRepository::save);
    }

    @Override
    public Mono<Return> update(UpdateReturnCommand command) {
        return returnRepository.findById(command.returnId())
                .flatMap(ret -> {
                    if (!ret.canModify()) {
                        return Mono.error(new IllegalStateException("Cannot modify confirmed return"));
                    }
                    var updated = rebuildWithUpdates(ret, command);
                    return returnRepository.deleteLinesByReturnId(ret.getId())
                            .then(returnRepository.save(updated));
                });
    }

    @Override
    public Mono<Return> confirm(UUID returnId) {
        return returnRepository.findById(returnId)
                .flatMap(ret -> {
                    var confirmed = ret.confirm();
                    return applyStockChanges(confirmed)
                            .then(returnRepository.save(confirmed));
                });
    }

    @Override
    public Mono<Return> cancel(UUID returnId) {
        return returnRepository.findById(returnId)
                .flatMap(ret -> returnRepository.save(ret.cancel()));
    }

    @Override
    public Mono<Void> delete(UUID returnId) {
        return returnRepository.findById(returnId)
                .flatMap(ret -> {
                    if (!ret.canDelete()) {
                        return Mono.error(new IllegalStateException("Cannot delete confirmed return"));
                    }
                    return returnRepository.deleteLinesByReturnId(returnId)
                            .then(returnRepository.deleteById(returnId));
                });
    }

    private Return buildReturn(String number, CreateReturnCommand cmd) {
        var counter = new AtomicInteger(0);
        var lines = cmd.lines().stream()
                .map(l -> ReturnLine.create(l.productId(), l.quantity(), l.unitPrice(),
                        l.unitCost(), counter.incrementAndGet()))
                .collect(Collectors.toList());
        return Return.create(number, cmd.type(), cmd.warehouseId(), cmd.originalDocumentId(),
                cmd.reason(), cmd.createdBy(), lines);
    }

    private Return rebuildWithUpdates(Return ret, UpdateReturnCommand cmd) {
        var counter = new AtomicInteger(0);
        var lines = cmd.lines().stream()
                .map(l -> ReturnLine.create(l.productId(), l.quantity(), l.unitPrice(),
                        l.unitCost(), counter.incrementAndGet()))
                .collect(Collectors.toList());
        return new Return(ret.getId(), ret.getReturnNumber(), ret.getType(), ret.getWarehouseId(),
                ret.getOriginalDocumentId(), ret.getStatus(), cmd.reason(), cmd.notes(),
                ret.getReturnDate(), ret.getCreatedBy(), ret.getCreatedAt(), null, lines);
    }

    private Mono<Void> applyStockChanges(Return ret) {
        return Flux.fromIterable(ret.getLines())
                .flatMap(line -> applyLineStock(ret, line))
                .then();
    }

    private Mono<Void> applyLineStock(Return ret, ReturnLine line) {
        // Sale return: cliente devuelve -> +stock
        // Purchase return: devolvemos a proveedor -> -stock
        if (ret.isSaleReturn()) {
            var movement = InventoryMovement.saleReturn(
                    ret.getWarehouseId(), line.getProductId(), line.getQuantity(),
                    line.getUnitCost(), line.getUnitPrice(), ret.getId(), null, ret.getCreatedBy()
            );
            return stockRepository.addStock(line.getProductId(), ret.getWarehouseId(),
                    line.getQuantity(), line.getUnitCost())
                    .then(movementRepository.save(movement))
                    .then();
        } else {
            var movement = InventoryMovement.purchaseReturn(
                    ret.getWarehouseId(), line.getProductId(), line.getQuantity(),
                    line.getUnitCost(), ret.getId(), null, ret.getCreatedBy()
            );
            return stockRepository.removeStock(line.getProductId(), ret.getWarehouseId(), line.getQuantity())
                    .then(movementRepository.save(movement))
                    .then();
        }
    }
}
