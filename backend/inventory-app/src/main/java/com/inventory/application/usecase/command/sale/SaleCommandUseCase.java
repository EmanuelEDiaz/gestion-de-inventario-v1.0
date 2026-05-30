package com.inventory.application.usecase.command.sale;

import com.inventory.application.shared.AuditSerializer;
import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.audit.AuditLog;
import com.inventory.domain.model.customer.CustomerDebt;
import com.inventory.domain.model.stock.InventoryMovement;
import com.inventory.domain.model.sale.Sale;
import com.inventory.domain.model.sale.SaleLine;
import com.inventory.domain.model.stock.StockBalance;
import com.inventory.domain.ports.in.sale.SaleCommandPort;
import com.inventory.domain.ports.out.AuditLogRepository;
import com.inventory.domain.ports.out.CustomerDebtRepository;
import com.inventory.domain.ports.out.MovementRepository;
import com.inventory.domain.ports.out.SaleRepository;
import com.inventory.domain.ports.out.StockRepository;
import com.inventory.domain.ports.out.SyncLogWriterPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class SaleCommandUseCase implements SaleCommandPort {

    private final SaleRepository saleRepository;
    private final StockRepository stockRepository;
    private final MovementRepository movementRepository;
    private final AuditLogRepository auditLogRepository;
    private final SyncLogWriterPort syncLogWriter;
    private final AuditSerializer auditSerializer;
    private final CustomerDebtRepository customerDebtRepository;
    public SaleCommandUseCase(
        SaleRepository saleRepository,
        StockRepository stockRepository,
        MovementRepository movementRepository,
        AuditLogRepository auditLogRepository,
        SyncLogWriterPort syncLogWriter,
        AuditSerializer auditSerializer,
        CustomerDebtRepository customerDebtRepository
    ) {
        this.saleRepository = saleRepository;
        this.stockRepository = stockRepository;
        this.movementRepository = movementRepository;
        this.auditLogRepository = auditLogRepository;
        this.syncLogWriter = syncLogWriter;
        this.auditSerializer = auditSerializer;
        this.customerDebtRepository = customerDebtRepository;
    }

    @Override
    @Transactional
    public Mono<Sale> create(CreateCommand command, UUID createdBy) {
        return switch (command.paymentMode()) {
            case CREDIT -> createCredit(command, createdBy);
            case RESERVE -> createReserve(command, createdBy);
            default -> createImmediate(command, createdBy);
        };
    }

    @Override
    @Transactional
    public Mono<Sale> createCredit(CreateCommand command, UUID createdBy) {
        if (command.customerId() == null) {
            return Mono.error(new BadRequestException("customerId is required for credit sales"));
        }
        if (command.lines() == null || command.lines().isEmpty()) {
            return Mono.error(new BadRequestException("At least one line is required"));
        }

        return saleRepository.generateSaleNumber()
            .flatMap(saleNumber -> createSaleDraft(saleNumber, command, createdBy, Sale.PaymentMode.CREDIT))
            .flatMap(draft -> confirm(draft.id()))
            .flatMap(confirmed -> deliver(confirmed.id()))
            .flatMap(delivered -> {
                CustomerDebt debt = CustomerDebt.create(
                    delivered.customerId(), delivered.id(),
                    delivered.total(), delivered.currencyCode()
                );
                return customerDebtRepository.save(debt)
                    .thenReturn(delivered);
            })
            .flatMap(saved -> auditLogRepository.save(AuditLog.create(
                createdBy, "SALE", saved.id(), "CREATE",
                null, auditSerializer.toJsonTruncated(saved), null))
                .then(syncLogWriter.log("SALE", saved.id(), "CREATE", saved, null))
                .thenReturn(saved));
    }

    @Override
    @Transactional
    public Mono<Sale> createReserve(CreateCommand command, UUID createdBy) {
        if (command.customerId() == null) {
            return Mono.error(new BadRequestException("customerId is required for reserve sales"));
        }
        if (command.lines() == null || command.lines().isEmpty()) {
            return Mono.error(new BadRequestException("At least one line is required"));
        }

        return saleRepository.generateSaleNumber()
            .flatMap(saleNumber -> createSaleDraft(saleNumber, command, createdBy, Sale.PaymentMode.RESERVE))
            .flatMap(draft -> confirm(draft.id()))
            .flatMap(saved -> auditLogRepository.save(AuditLog.create(
                createdBy, "SALE", saved.id(), "CREATE",
                null, auditSerializer.toJsonTruncated(saved), null))
                .then(syncLogWriter.log("SALE", saved.id(), "CREATE", saved, null))
                .thenReturn(saved));
    }

    private Mono<Sale> createImmediate(CreateCommand command, UUID createdBy) {
        if (command.warehouseId() == null) {
            return Mono.error(new BadRequestException("Warehouse is required"));
        }
        if (command.lines() == null || command.lines().isEmpty()) {
            return Mono.error(new BadRequestException("At least one line is required"));
        }

        return saleRepository.generateSaleNumber()
            .flatMap(saleNumber -> createSaleDraft(saleNumber, command, createdBy, Sale.PaymentMode.IMMEDIATE))
            .flatMap(saved -> auditLogRepository.save(AuditLog.create(
                createdBy, "SALE", saved.id(), "CREATE",
                null, auditSerializer.toJsonTruncated(saved), null))
                .then(syncLogWriter.log("SALE", saved.id(), "CREATE", saved, null))
                .thenReturn(saved));
    }

    private Mono<Sale> createSaleDraft(String saleNumber, CreateCommand command, UUID createdBy,
                                        Sale.PaymentMode paymentMode) {
        AtomicInteger sortOrder = new AtomicInteger(0);
        List<SaleLine> lines = command.lines().stream()
            .map(line -> SaleLine.create(
                line.productId(),
                line.quantity(),
                line.unitPrice(),
                line.discount(),
                sortOrder.incrementAndGet()
            ))
            .toList();

        Sale sale = Sale.createDraft(
            saleNumber,
            command.warehouseId(),
            command.customerId(),
            command.currencyCode(),
            command.notes(),
            command.saleDate(),
            lines,
            createdBy,
            paymentMode
        );

        return saleRepository.save(sale);
    }

    @Override
    @Transactional
    public Mono<Sale> confirm(UUID saleId) {
        return saleRepository.findById(saleId)
            .switchIfEmpty(Mono.error(new NotFoundException("Sale not found")))
            .flatMap(sale -> {
                Sale confirmed = sale.confirm();
                
                // Reserve stock for each line
                return Flux.fromIterable(sale.lines())
                    .flatMap(line -> reserveStock(sale.warehouseId(), line))
                    .then(saleRepository.save(confirmed));
            });
    }

    private Mono<StockBalance> reserveStock(UUID warehouseId, SaleLine line) {
        return stockRepository.findById(warehouseId, line.productId())
            .switchIfEmpty(Mono.error(new BadRequestException(
                "No stock available for product: " + line.productId())))
            .flatMap(stock -> {
                BigDecimal available = stock.getAvailable();
                BigDecimal requested = BigDecimal.valueOf(line.quantity());
                if (available.compareTo(requested) < 0) {
                    return Mono.error(new BadRequestException(
                        "Insufficient stock for product: " + line.productId() + 
                        ". Available: " + available + ", Requested: " + line.quantity()));
                }
                StockBalance reserved = stock.reserve(requested);
                return stockRepository.save(reserved);
            });
    }

    @Override
    @Transactional
    public Mono<Sale> deliver(UUID saleId) {
        return saleRepository.findById(saleId)
            .switchIfEmpty(Mono.error(new NotFoundException("Sale not found")))
            .flatMap(sale -> {
                Sale delivered = sale.deliver();
                
                // Decrease stock and create movements
                return Flux.fromIterable(sale.lines())
                    .flatMap(line -> processDelivery(sale, line))
                    .then(saleRepository.save(delivered));
            });
    }

    private Mono<Void> processDelivery(Sale sale, SaleLine line) {
        return stockRepository.findById(sale.warehouseId(), line.productId())
            .flatMap(stock -> {
                BigDecimal qty = BigDecimal.valueOf(line.quantity());
                // Release reservation and decrease stock
                StockBalance unreserved = stock.unreserve(qty);
                StockBalance decreased = unreserved.removeStock(qty);
                
                // Create sale movement
                InventoryMovement movement = InventoryMovement.sale(
                    sale.warehouseId(),
                    line.productId(),
                    qty,
                    stock.getAvgCost(),
                    line.unitPrice(),
                    sale.id(),
                    decreased.getOnHand(),
                    sale.createdBy()
                );

                return stockRepository.save(decreased)
                    .then(movementRepository.save(movement))
                    .then();
            });
    }

    @Override
    @Transactional
    public Mono<Sale> cancel(UUID saleId) {
        return saleRepository.findById(saleId)
            .switchIfEmpty(Mono.error(new NotFoundException("Sale not found")))
            .flatMap(sale -> {
                Sale cancelled = sale.cancel();

                if (sale.status() == Sale.SaleStatus.CONFIRMED) {
                    return Flux.fromIterable(sale.lines())
                        .flatMap(line -> releaseReservedStock(sale.warehouseId(), line))
                        .then(saleRepository.save(cancelled));
                }

                return saleRepository.save(cancelled);
            });
    }

    private Mono<StockBalance> releaseReservedStock(UUID warehouseId, SaleLine line) {
        return stockRepository.findById(warehouseId, line.productId())
            .flatMap(stock -> {
                StockBalance released = stock.unreserve(BigDecimal.valueOf(line.quantity()));
                return stockRepository.save(released);
            });
    }

    @Override
    @Transactional
    public Mono<Void> delete(UUID saleId) {
        return saleRepository.findById(saleId)
            .switchIfEmpty(Mono.error(new NotFoundException("Sale not found")))
            .flatMap(sale -> {
                if (!sale.canDelete()) {
                    return Mono.error(new BadRequestException(
                        "Cannot delete sale with status: " + sale.status()));
                }
                return saleRepository.deleteById(saleId)
                    .then(syncLogWriter.log("SALE", saleId, "DELETE", sale, null));
            });
    }

    @Override
    @Transactional
    public Mono<Void> deleteAll(List<UUID> ids) {
        if (ids.isEmpty()) return Mono.empty();
        return Flux.fromIterable(ids)
            .flatMap(id -> saleRepository.findById(id)
                .switchIfEmpty(Mono.error(new NotFoundException("Sale not found")))
                .flatMap(sale -> {
                    if (!sale.canDelete()) {
                        return Mono.error(new BadRequestException(
                            "Cannot delete sale with status: " + sale.status()));
                    }
                    return Mono.just(id);
                }))
            .then(saleRepository.deleteAllById(ids));
    }
}
