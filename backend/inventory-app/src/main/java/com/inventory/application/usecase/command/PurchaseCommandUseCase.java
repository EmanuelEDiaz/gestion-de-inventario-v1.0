package com.inventory.application.usecase.command;

import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.stock.InventoryMovement;
import com.inventory.domain.model.purchase.Purchase;
import com.inventory.domain.model.purchase.PurchaseLine;
import com.inventory.domain.ports.in.purchase.PurchaseCommandPort;
import com.inventory.domain.ports.out.MovementRepository;
import com.inventory.domain.ports.out.PurchaseRepository;
import com.inventory.domain.ports.out.StockRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PurchaseCommandUseCase implements PurchaseCommandPort {

    private final PurchaseRepository purchaseRepository;
    private final StockRepository stockRepository;
    private final MovementRepository movementRepository;

    public PurchaseCommandUseCase(
            PurchaseRepository purchaseRepository,
            StockRepository stockRepository,
            MovementRepository movementRepository) {
        this.purchaseRepository = purchaseRepository;
        this.stockRepository = stockRepository;
        this.movementRepository = movementRepository;
    }

    @Override
    @Transactional
    public Mono<Purchase> create(CreatePurchaseCommand command) {
        return purchaseRepository.generateNextNumber()
                .flatMap(purchaseNumber -> {
                    List<PurchaseLine> lines = new ArrayList<>();
                    int sortOrder = 0;
                    for (CreatePurchaseCommand.LineItem item : command.lines()) {
                        lines.add(PurchaseLine.create(item.productId(), item.quantity(), item.unitCost(), sortOrder++));
                    }
                    
                    Purchase purchase = Purchase.create(
                            purchaseNumber,
                            command.warehouseId(),
                            command.supplierId(),
                            command.createdBy(),
                            lines
                    );
                    
                    return purchaseRepository.save(purchase);
                });
    }

    @Override
    @Transactional
    public Mono<Purchase> confirm(UUID purchaseId) {
        return purchaseRepository.findById(purchaseId)
                .switchIfEmpty(Mono.error(new NotFoundException("Purchase not found: " + purchaseId)))
                .flatMap(purchase -> {
                    if (!purchase.canConfirm()) {
                        return Mono.error(new BadRequestException("Cannot confirm purchase in status: " + purchase.getStatus()));
                    }
                    Purchase confirmed = purchase.confirm();
                    return purchaseRepository.save(confirmed);
                });
    }

    @Override
    @Transactional
    public Mono<Purchase> receive(UUID purchaseId, LocalDate receivedDate) {
        return purchaseRepository.findById(purchaseId)
                .switchIfEmpty(Mono.error(new NotFoundException("Purchase not found: " + purchaseId)))
                .flatMap(purchase -> {
                    if (!purchase.canReceive()) {
                        return Mono.error(new BadRequestException("Cannot receive purchase in status: " + purchase.getStatus()));
                    }
                    
                    // Actualizar stock y crear movimientos para cada línea
                    return Flux.fromIterable(purchase.getLines())
                            .flatMap(line -> updateStockForLine(purchase, line))
                            .then(Mono.defer(() -> {
                                Purchase received = purchase.receive(receivedDate != null ? receivedDate : LocalDate.now());
                                return purchaseRepository.save(received);
                            }));
                });
    }

    private Mono<Void> updateStockForLine(Purchase purchase, PurchaseLine line) {
        UUID warehouseId = purchase.getWarehouseId();
        UUID productId = line.getProductId();
        BigDecimal quantity = line.getQuantity();
        BigDecimal unitCost = line.getUnitCost();
        
        return stockRepository.addStock(warehouseId, productId, quantity, unitCost)
                .flatMap(stockBalance -> {
                    InventoryMovement movement = InventoryMovement.purchase(
                            warehouseId,
                            productId,
                            quantity,
                            unitCost,
                            purchase.getId(),
                            stockBalance.getOnHand(),
                            purchase.getCreatedBy()
                    );
                    return movementRepository.save(movement);
                })
                .then();
    }

    @Override
    @Transactional
    public Mono<Purchase> cancel(UUID purchaseId) {
        return purchaseRepository.findById(purchaseId)
                .switchIfEmpty(Mono.error(new NotFoundException("Purchase not found: " + purchaseId)))
                .flatMap(purchase -> {
                    if (!purchase.canCancel()) {
                        return Mono.error(new BadRequestException("Cannot cancel purchase in status: " + purchase.getStatus()));
                    }
                    Purchase cancelled = purchase.cancel();
                    return purchaseRepository.save(cancelled);
                });
    }

    @Override
    @Transactional
    public Mono<Purchase> update(UUID purchaseId, UpdatePurchaseCommand command) {
        return purchaseRepository.findById(purchaseId)
                .switchIfEmpty(Mono.error(new NotFoundException("Purchase not found: " + purchaseId)))
                .flatMap(purchase -> {
                    if (purchase.getStatus() != Purchase.PurchaseStatus.DRAFT) {
                        return Mono.error(new BadRequestException("Can only update purchases in DRAFT status"));
                    }
                    
                    List<PurchaseLine> lines = new ArrayList<>();
                    int sortOrder = 0;
                    for (CreatePurchaseCommand.LineItem item : command.lines()) {
                        lines.add(PurchaseLine.create(item.productId(), item.quantity(), item.unitCost(), sortOrder++));
                    }
                    
                    BigDecimal subtotal = lines.stream()
                            .map(PurchaseLine::getTotalCost)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    Purchase updated = new Purchase(
                            purchase.getId(),
                            purchase.getPurchaseNumber(),
                            command.supplierId(),
                            purchase.getWarehouseId(),
                            Purchase.PurchaseStatus.DRAFT,
                            command.currencyCode(),
                            purchase.getExchangeRate(),
                            subtotal,
                            purchase.getTaxAmount(),
                            subtotal.add(purchase.getTaxAmount()),
                            command.notes(),
                            command.purchaseDate(),
                            null,
                            purchase.getCreatedBy(),
                            purchase.getCreatedAt(),
                            java.time.Instant.now(),
                            purchase.getVersion(),
                            lines
                    );
                    
                    return purchaseRepository.save(updated);
                });
    }

    @Override
    @Transactional
    public Mono<Void> delete(UUID purchaseId) {
        return purchaseRepository.findById(purchaseId)
                .switchIfEmpty(Mono.error(new NotFoundException("Purchase not found: " + purchaseId)))
                .flatMap(purchase -> {
                    if (purchase.getStatus() != Purchase.PurchaseStatus.DRAFT) {
                        return Mono.error(new BadRequestException("Can only delete purchases in DRAFT status"));
                    }
                    return purchaseRepository.delete(purchaseId);
                });
    }
}
