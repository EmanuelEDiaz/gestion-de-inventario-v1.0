package com.inventory.domain.ports.in;

import com.inventory.domain.model.Sale;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

public interface SaleQueryPort {
    Mono<Sale> findById(UUID id);
    Mono<Sale> findByNumber(String saleNumber);
    Flux<Sale> findAll();
    Flux<Sale> findByWarehouse(UUID warehouseId);
    Flux<Sale> findByCustomer(UUID customerId);
    Flux<Sale> findByStatus(Sale.SaleStatus status);
    Flux<Sale> findByDateRange(LocalDate from, LocalDate to);
}
