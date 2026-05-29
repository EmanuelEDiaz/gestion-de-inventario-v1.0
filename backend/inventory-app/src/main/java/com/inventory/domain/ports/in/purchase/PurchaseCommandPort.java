package com.inventory.domain.ports.in.purchase;

import com.inventory.domain.model.purchase.Purchase;
import com.inventory.domain.model.purchase.PurchaseLine;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Puerto de entrada: Comandos de Compras.
 */
public interface PurchaseCommandPort {

    /**
     * Crea una nueva compra en estado DRAFT.
     */
    Mono<Purchase> create(CreatePurchaseCommand command, UUID userId);

    Mono<Purchase> confirm(UUID purchaseId, UUID userId);

    Mono<Purchase> receive(UUID purchaseId, LocalDate receivedDate, UUID userId);

    Mono<Purchase> cancel(UUID purchaseId, UUID userId);

    Mono<Purchase> update(UUID purchaseId, UpdatePurchaseCommand command, UUID userId);

    Mono<Void> delete(UUID purchaseId, UUID userId);

    Mono<Void> deleteAll(List<UUID> ids, UUID userId);

    record CreatePurchaseCommand(
        UUID warehouseId,
        UUID supplierId,
        String currencyCode,
        String notes,
        LocalDate purchaseDate,
        List<LineItem> lines,
        UUID createdBy
    ) {
        public record LineItem(UUID productId, java.math.BigDecimal quantity, java.math.BigDecimal unitCost) {}
    }

    record UpdatePurchaseCommand(
        UUID supplierId,
        String currencyCode,
        String notes,
        LocalDate purchaseDate,
        List<CreatePurchaseCommand.LineItem> lines
    ) {}
}
