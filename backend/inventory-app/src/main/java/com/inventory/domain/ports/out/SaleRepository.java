package com.inventory.domain.ports.out;

import com.inventory.domain.model.sale.Sale;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface SaleRepository {
    Mono<Sale> findById(UUID id);
    Mono<Sale> findByNumber(String saleNumber);
    Flux<Sale> findAll();
    Flux<Sale> findByWarehouseId(UUID warehouseId);
    Flux<Sale> findByCustomerId(UUID customerId);
    Flux<Sale> findByStatus(Sale.SaleStatus status);
    Flux<Sale> findByDateRange(LocalDate from, LocalDate to);
    Mono<Sale> save(Sale sale);
    Mono<Void> deleteById(UUID id);
    Mono<Void> deleteAllById(List<UUID> ids);
    Mono<String> generateSaleNumber();
}
