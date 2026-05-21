package com.inventory.domain.ports.in;

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
    Mono<Purchase> create(CreatePurchaseCommand command);

    /**
     * Confirma una compra (DRAFT → CONFIRMED).
     */
    Mono<Purchase> confirm(UUID purchaseId);

    /**
     * Recibe productos de una compra y actualiza stock.
     * (CONFIRMED → RECEIVED)
     */
    Mono<Purchase> receive(UUID purchaseId, LocalDate receivedDate);

    /**
     * Cancela una compra.
     */
    Mono<Purchase> cancel(UUID purchaseId);

    /**
     * Actualiza una compra en DRAFT.
     */
    Mono<Purchase> update(UUID purchaseId, UpdatePurchaseCommand command);

    /**
     * Elimina una compra en DRAFT.
     */
    Mono<Void> delete(UUID purchaseId);

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
