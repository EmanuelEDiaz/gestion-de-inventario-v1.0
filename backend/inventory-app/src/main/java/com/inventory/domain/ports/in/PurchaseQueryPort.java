package com.inventory.domain.ports.in;

import com.inventory.domain.model.Purchase;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Puerto de entrada: Consultas de Compras.
 */
public interface PurchaseQueryPort {

    Mono<Purchase> findById(UUID id);

    Mono<Purchase> findByNumber(String purchaseNumber);

    Flux<Purchase> findAll(PurchaseFilter filter);

    Flux<Purchase> findBySupplierId(UUID supplierId);

    Flux<Purchase> findByWarehouseId(UUID warehouseId);

    Flux<Purchase> findByStatus(Purchase.PurchaseStatus status);

    Mono<Long> count(PurchaseFilter filter);

    record PurchaseFilter(
        UUID supplierId,
        UUID warehouseId,
        Purchase.PurchaseStatus status,
        LocalDate fromDate,
        LocalDate toDate,
        int page,
        int size
    ) {
        public static PurchaseFilter all(int page, int size) {
            return new PurchaseFilter(null, null, null, null, null, page, size);
        }
    }
}
