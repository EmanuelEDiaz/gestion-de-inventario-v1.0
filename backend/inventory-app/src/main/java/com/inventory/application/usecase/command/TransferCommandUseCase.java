package com.inventory.application.usecase.command;

import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.stock.InventoryMovement;
import com.inventory.domain.model.stock.StockBalance;
import com.inventory.domain.model.transfer.Transfer;
import com.inventory.domain.model.transfer.TransferLine;
import com.inventory.domain.ports.in.transfer.TransferCommandPort;
import com.inventory.domain.ports.out.MovementRepository;
import com.inventory.domain.ports.out.StockRepository;
import com.inventory.domain.ports.out.TransferRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Use Case: Comandos de Transferencias.
 * Implementa TransferCommandPort (clean-code: SRP por operación).
 */
@Service
public class TransferCommandUseCase implements TransferCommandPort {

    private final TransferRepository transferRepository;
    private final StockRepository stockRepository;
    private final MovementRepository movementRepository;

    public TransferCommandUseCase(
            TransferRepository transferRepository,
            StockRepository stockRepository,
            MovementRepository movementRepository) {
        this.transferRepository = transferRepository;
        this.stockRepository = stockRepository;
        this.movementRepository = movementRepository;
    }

    @Override
    @Transactional
    public Mono<Transfer> create(CreateTransferCommand command) {
        return transferRepository.generateNextTransferNumber()
                .flatMap(number -> {
                    List<TransferLine> lines = buildLines(command.lines());
                    Transfer transfer = Transfer.create(
                            number,
                            command.fromWarehouseId(),
                            command.toWarehouseId(),
                            command.createdBy(),
                            lines);
                    return transferRepository.save(transfer);
                });
    }

    @Override
    @Transactional
    public Mono<Transfer> update(UUID id, UpdateTransferCommand command) {
        return findAndValidateForUpdate(id)
                .flatMap(transfer -> {
                    Transfer updated = new Transfer(
                            transfer.getId(),
                            transfer.getTransferNumber(),
                            command.fromWarehouseId() != null ? command.fromWarehouseId() : transfer.getFromWarehouseId(),
                            command.toWarehouseId() != null ? command.toWarehouseId() : transfer.getToWarehouseId(),
                            transfer.getStatus(),
                            command.notes(),
                            command.transferDate() != null ? command.transferDate() : transfer.getTransferDate(),
                            transfer.getReceivedDate(),
                            transfer.getCreatedBy(),
                            transfer.getCreatedAt(),
                            null,
                            buildLines(command.lines()));
                    return transferRepository.save(updated);
                });
    }

    @Override
    @Transactional
    public Mono<Transfer> confirm(UUID id) {
        return findById(id)
                .flatMap(transfer -> {
                    if (!transfer.canConfirm()) {
                        return Mono.error(new BadRequestException("Cannot confirm: " + transfer.getStatus()));
                    }
                    // Validar stock disponible en almacén origen
                    return validateStock(transfer)
                            .then(Mono.defer(() -> {
                                // Reservar stock (decrementar en origen)
                                return reserveStock(transfer)
                                        .then(Mono.defer(() -> transferRepository.save(transfer.confirm())));
                            }));
                });
    }

    @Override
    @Transactional
    public Mono<Transfer> ship(UUID id) {
        return findById(id)
                .flatMap(transfer -> {
                    if (!transfer.canShip()) {
                        return Mono.error(new BadRequestException("Cannot ship: " + transfer.getStatus()));
                    }
                    return transferRepository.save(transfer.ship());
                });
    }

    @Override
    @Transactional
    public Mono<Transfer> complete(UUID id, LocalDate receivedDate) {
        return findById(id)
                .flatMap(transfer -> {
                    if (!transfer.canComplete()) {
                        return Mono.error(new BadRequestException("Cannot complete: " + transfer.getStatus()));
                    }
                    // Incrementar stock en destino
                    return addStockToDestination(transfer)
                            .then(Mono.defer(() -> transferRepository.save(
                                    transfer.complete(receivedDate != null ? receivedDate : LocalDate.now()))));
                });
    }

    @Override
    @Transactional
    public Mono<Transfer> cancel(UUID id) {
        return findById(id)
                .flatMap(transfer -> {
                    Transfer.TransferStatus status = transfer.getStatus();
                    if (status == Transfer.TransferStatus.COMPLETED) {
                        return Mono.error(new BadRequestException("Cannot cancel completed transfer"));
                    }
                    // Si estaba confirmada o en tránsito, devolver stock a origen
                    if (status == Transfer.TransferStatus.CONFIRMED || status == Transfer.TransferStatus.IN_TRANSIT) {
                        return restoreStock(transfer)
                                .then(Mono.defer(() -> transferRepository.save(transfer.cancel())));
                    }
                    return transferRepository.save(transfer.cancel());
                });
    }

    @Override
    @Transactional
    public Mono<Void> delete(UUID id) {
        return findById(id)
                .flatMap(transfer -> {
                    if (!transfer.canDelete()) {
                        return Mono.error(new BadRequestException("Cannot delete: " + transfer.getStatus()));
                    }
                    return transferRepository.deleteById(id);
                });
    }

    // Métodos auxiliares (clean-code: máx 20 líneas, single responsibility)

    private List<TransferLine> buildLines(List<CreateTransferCommand.LineItem> items) {
        List<TransferLine> lines = new ArrayList<>();
        int sortOrder = 0;
        for (CreateTransferCommand.LineItem item : items) {
            lines.add(TransferLine.create(item.productId(), item.quantity(), sortOrder++));
        }
        return lines;
    }

    private Mono<Transfer> findById(UUID id) {
        return transferRepository.findById(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Transfer not found: " + id)));
    }

    private Mono<Transfer> findAndValidateForUpdate(UUID id) {
        return findById(id)
                .flatMap(transfer -> {
                    if (!transfer.canModify()) {
                        return Mono.error(new BadRequestException("Cannot modify: " + transfer.getStatus()));
                    }
                    return Mono.just(transfer);
                });
    }

    private Mono<Void> validateStock(Transfer transfer) {
        return Flux.fromIterable(transfer.getLines())
                .flatMap(line -> stockRepository.findById(
                        transfer.getFromWarehouseId(), line.getProductId())
                        .switchIfEmpty(Mono.error(new BadRequestException(
                                "No stock for product: " + line.getProductId())))
                        .flatMap(balance -> {
                            if (balance.getAvailable().compareTo(line.getQuantity()) < 0) {
                                return Mono.error(new BadRequestException(
                                        "Insufficient stock for product: " + line.getProductId()));
                            }
                            return Mono.empty();
                        }))
                .then();
    }

    private Mono<Void> reserveStock(Transfer transfer) {
        return Flux.fromIterable(transfer.getLines())
                .flatMap(line -> decrementStock(
                        transfer.getFromWarehouseId(),
                        line.getProductId(),
                        line.getQuantity(),
                        transfer.getId(),
                        transfer.getCreatedBy()))
                .then();
    }

    private Mono<Void> addStockToDestination(Transfer transfer) {
        return Flux.fromIterable(transfer.getLines())
                .flatMap(line -> incrementStock(
                        transfer.getToWarehouseId(),
                        line.getProductId(),
                        line.getQuantity(),
                        transfer.getId(),
                        transfer.getCreatedBy()))
                .then();
    }

    private Mono<Void> restoreStock(Transfer transfer) {
        return Flux.fromIterable(transfer.getLines())
                .flatMap(line -> incrementStock(
                        transfer.getFromWarehouseId(),
                        line.getProductId(),
                        line.getQuantity(),
                        transfer.getId(),
                        transfer.getCreatedBy()))
                .then();
    }

    private Mono<Void> decrementStock(UUID warehouseId, UUID productId, BigDecimal quantity,
                                       UUID transferId, UUID createdBy) {
        return stockRepository.findById(warehouseId, productId)
                .flatMap(balance -> {
                    StockBalance updated = balance.removeStock(quantity);
                    return stockRepository.save(updated)
                            .flatMap(saved -> {
                                InventoryMovement movement = InventoryMovement.transferOut(
                                        warehouseId, productId, quantity, balance.getAvgCost(),
                                        transferId, saved.getOnHand(), createdBy);
                                return movementRepository.save(movement);
                            });
                })
                .then();
    }

    private Mono<Void> incrementStock(UUID warehouseId, UUID productId, BigDecimal quantity,
                                       UUID transferId, UUID createdBy) {
        return stockRepository.findById(warehouseId, productId)
                .defaultIfEmpty(StockBalance.empty(warehouseId, productId))
                .flatMap(balance -> {
                    StockBalance updated = balance.addStock(quantity, balance.getAvgCost());
                    return stockRepository.save(updated)
                            .flatMap(saved -> {
                                InventoryMovement movement = InventoryMovement.transferIn(
                                        warehouseId, productId, quantity, balance.getAvgCost(),
                                        transferId, saved.getOnHand(), createdBy);
                                return movementRepository.save(movement);
                            });
                })
                .then();
    }
}
