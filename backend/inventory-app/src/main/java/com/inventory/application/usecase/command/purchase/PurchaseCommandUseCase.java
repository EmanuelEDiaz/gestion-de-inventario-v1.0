package com.inventory.application.usecase.command.purchase;

import com.inventory.application.shared.AuditSerializer;
import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.audit.AuditLog;
import com.inventory.domain.model.stock.InventoryMovement;
import com.inventory.domain.model.purchase.Purchase;
import com.inventory.domain.model.purchase.PurchaseLine;
import com.inventory.domain.ports.in.purchase.PurchaseCommandPort;
import com.inventory.domain.ports.out.AuditLogRepository;
import com.inventory.domain.ports.out.MovementRepository;
import com.inventory.domain.ports.out.PurchaseRepository;
import com.inventory.domain.ports.out.StockRepository;
import com.inventory.domain.ports.out.SyncLogWriterPort;
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
    private final AuditLogRepository auditLogRepository;
    private final SyncLogWriterPort syncLogWriter;
    private final AuditSerializer auditSerializer;

    public PurchaseCommandUseCase(
            PurchaseRepository purchaseRepository,
            StockRepository stockRepository,
            MovementRepository movementRepository,
            AuditLogRepository auditLogRepository,
            SyncLogWriterPort syncLogWriter,
            AuditSerializer auditSerializer) {
        this.purchaseRepository = purchaseRepository;
        this.stockRepository = stockRepository;
        this.movementRepository = movementRepository;
        this.auditLogRepository = auditLogRepository;
        this.syncLogWriter = syncLogWriter;
        this.auditSerializer = auditSerializer;
    }

    @Override
    @Transactional
    public Mono<Purchase> create(CreatePurchaseCommand command, UUID userId) {
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
                            command.createdBy() != null ? command.createdBy() : userId,
                            lines
                    );
                    
                    return purchaseRepository.save(purchase);
                })
                .flatMap(saved -> {
                    AuditLog log = AuditLog.create(
                            userId, "PURCHASE", saved.getId(), "CREATE",
                            null, auditSerializer.toJsonTruncated(saved), null);
                    return auditLogRepository.save(log)
                            .then(syncLogWriter.log("PURCHASE", saved.getId(), "CREATE", saved, null))
                            .thenReturn(saved);
                });
    }

    @Override
    @Transactional
    public Mono<Purchase> confirm(UUID purchaseId, UUID userId) {
        return purchaseRepository.findById(purchaseId)
                .switchIfEmpty(Mono.error(new NotFoundException("Purchase not found: " + purchaseId)))
                .flatMap(purchase -> {
                    if (!purchase.canConfirm()) {
                        return Mono.error(new BadRequestException("Cannot confirm purchase in status: " + purchase.getStatus()));
                    }
                    String beforeData = auditSerializer.toJsonTruncated(purchase);
                    Purchase confirmed = purchase.confirm();
                    return purchaseRepository.save(confirmed)
                            .flatMap(saved -> {
                                AuditLog log = AuditLog.create(
                                        userId, "PURCHASE", saved.getId(), "CONFIRM",
                                        beforeData, auditSerializer.toJsonTruncated(saved), null);
                                return auditLogRepository.save(log)
                                        .then(syncLogWriter.log("PURCHASE", saved.getId(), "CONFIRM", saved, null))
                                        .thenReturn(saved);
                            });
                });
    }

    @Override
    @Transactional
    public Mono<Purchase> receive(UUID purchaseId, LocalDate receivedDate, UUID userId) {
        return purchaseRepository.findById(purchaseId)
                .switchIfEmpty(Mono.error(new NotFoundException("Purchase not found: " + purchaseId)))
                .flatMap(purchase -> {
                    if (!purchase.canReceive()) {
                        return Mono.error(new BadRequestException("Cannot receive purchase in status: " + purchase.getStatus()));
                    }
                    
                    String beforeData = auditSerializer.toJsonTruncated(purchase);
                    
                    return Flux.fromIterable(purchase.getLines())
                            .flatMap(line -> updateStockForLine(purchase, line))
                            .then(Mono.defer(() -> {
                                Purchase received = purchase.receive(receivedDate != null ? receivedDate : LocalDate.now());
                                return purchaseRepository.save(received);
                            }))
                            .flatMap(saved -> {
                                AuditLog log = AuditLog.create(
                                        userId, "PURCHASE", saved.getId(), "RECEIVE",
                                        beforeData, auditSerializer.toJsonTruncated(saved), null);
                                return auditLogRepository.save(log)
                                        .then(syncLogWriter.log("PURCHASE", saved.getId(), "RECEIVE", saved, null))
                                        .thenReturn(saved);
                            });
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
    public Mono<Purchase> cancel(UUID purchaseId, UUID userId) {
        return purchaseRepository.findById(purchaseId)
                .switchIfEmpty(Mono.error(new NotFoundException("Purchase not found: " + purchaseId)))
                .flatMap(purchase -> {
                    if (!purchase.canCancel()) {
                        return Mono.error(new BadRequestException("Cannot cancel purchase in status: " + purchase.getStatus()));
                    }
                    String beforeData = auditSerializer.toJsonTruncated(purchase);
                    Purchase cancelled = purchase.cancel();
                    return purchaseRepository.save(cancelled)
                            .flatMap(saved -> {
                                AuditLog log = AuditLog.create(
                                        userId, "PURCHASE", saved.getId(), "CANCEL",
                                        beforeData, auditSerializer.toJsonTruncated(saved), null);
                                return auditLogRepository.save(log)
                                        .then(syncLogWriter.log("PURCHASE", saved.getId(), "CANCEL", saved, null))
                                        .thenReturn(saved);
                            });
                });
    }

    @Override
    @Transactional
    public Mono<Purchase> update(UUID purchaseId, UpdatePurchaseCommand command, UUID userId) {
        return purchaseRepository.findById(purchaseId)
                .switchIfEmpty(Mono.error(new NotFoundException("Purchase not found: " + purchaseId)))
                .flatMap(purchase -> {
                    if (purchase.getStatus() != Purchase.PurchaseStatus.DRAFT) {
                        return Mono.error(new BadRequestException("Can only update purchases in DRAFT status"));
                    }
                    
                    String beforeData = auditSerializer.toJsonTruncated(purchase);
                    
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
                    
                    return purchaseRepository.save(updated)
                            .flatMap(saved -> {
                                AuditLog log = AuditLog.create(
                                        userId, "PURCHASE", saved.getId(), "UPDATE",
                                        beforeData, auditSerializer.toJsonTruncated(saved), null);
                                return auditLogRepository.save(log)
                                        .then(syncLogWriter.log("PURCHASE", saved.getId(), "UPDATE", saved, null))
                                        .thenReturn(saved);
                            });
                });
    }

    @Override
    @Transactional
    public Mono<Void> delete(UUID purchaseId, UUID userId) {
        return purchaseRepository.findById(purchaseId)
                .switchIfEmpty(Mono.error(new NotFoundException("Purchase not found: " + purchaseId)))
                .flatMap(purchase -> {
                    if (purchase.getStatus() != Purchase.PurchaseStatus.DRAFT) {
                        return Mono.error(new BadRequestException("Can only delete purchases in DRAFT status"));
                    }
                    String beforeData = auditSerializer.toJsonTruncated(purchase);
                    return purchaseRepository.delete(purchaseId)
                            .then(Mono.defer(() -> {
                                AuditLog log = AuditLog.create(
                                        userId, "PURCHASE", purchaseId, "DELETE",
                                        beforeData, null, null);
                                return auditLogRepository.save(log);
                            }))
                            .then(syncLogWriter.log("PURCHASE", purchaseId, "DELETE", purchase, null));
                });
    }

    @Override
    @Transactional
    public Mono<Void> deleteAll(List<UUID> ids, UUID userId) {
        if (ids.isEmpty()) return Mono.empty();
        return Flux.fromIterable(ids)
                .flatMap(id -> purchaseRepository.findById(id)
                        .switchIfEmpty(Mono.error(new NotFoundException("Purchase not found: " + id)))
                        .flatMap(purchase -> {
                            if (purchase.getStatus() != Purchase.PurchaseStatus.DRAFT) {
                                return Mono.error(new BadRequestException("Can only delete purchases in DRAFT status"));
                            }
                            String beforeData = auditSerializer.toJsonTruncated(purchase);
                            return Mono.just(new AuditEntry(id, beforeData));
                        }))
                .collectList()
                .flatMap(auditEntries -> purchaseRepository.deleteAllById(ids)
                        .thenMany(Flux.fromIterable(auditEntries))
                        .flatMap(entry -> {
                            AuditLog log = AuditLog.create(
                                    userId, "PURCHASE", entry.id(), "DELETE",
                                    entry.beforeData(), null, null);
                            return auditLogRepository.save(log);
                        })
                        .then());
    }

    private record AuditEntry(UUID id, String beforeData) {}
}
