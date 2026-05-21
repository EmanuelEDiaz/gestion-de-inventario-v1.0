package com.inventory.domain.ports.out;

import com.inventory.domain.model.purchase.Purchase;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Puerto de salida: Repositorio de Compras.
 */
public interface PurchaseRepository {

    Mono<Purchase> findById(UUID id);

    Mono<Purchase> findByPurchaseNumber(String purchaseNumber);

    Flux<Purchase> findBySupplierId(UUID supplierId);

    Flux<Purchase> findByWarehouseId(UUID warehouseId);

    Flux<Purchase> findByStatus(Purchase.PurchaseStatus status);

    Flux<Purchase> findByDateRange(LocalDate from, LocalDate to);

    Flux<Purchase> findAllPaginated(int page, int size);

    Mono<Purchase> save(Purchase purchase);

    Mono<Void> delete(UUID id);

    Mono<Long> count();

    Mono<String> generateNextNumber();
}
