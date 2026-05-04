package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.SaleEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

public interface R2dbcSaleRepository extends ReactiveCrudRepository<SaleEntity, UUID> {

    Mono<SaleEntity> findBySaleNumber(String saleNumber);

    Flux<SaleEntity> findByWarehouseId(UUID warehouseId);

    Flux<SaleEntity> findByCustomerId(UUID customerId);

    Flux<SaleEntity> findByStatus(String status);

    @Query("SELECT * FROM sales WHERE sale_date >= :from AND sale_date <= :to ORDER BY sale_date DESC")
    Flux<SaleEntity> findByDateRange(LocalDate from, LocalDate to);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(sale_number FROM 5) AS INTEGER)), 0) + 1 FROM sales WHERE sale_number LIKE 'VTA-%'")
    Mono<Integer> getNextSaleNumber();

    Flux<SaleEntity> findAllByOrderBySaleDateDesc();
}
