package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.PurchaseEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

@Repository
public interface R2dbcPurchaseRepository extends ReactiveCrudRepository<PurchaseEntity, UUID> {

    Mono<PurchaseEntity> findByPurchaseNumber(String purchaseNumber);

    Flux<PurchaseEntity> findBySupplierId(UUID supplierId);

    Flux<PurchaseEntity> findByWarehouseId(UUID warehouseId);

    Flux<PurchaseEntity> findByStatus(String status);

    @Query("SELECT * FROM purchases WHERE purchase_date >= :from AND purchase_date <= :to ORDER BY purchase_date DESC")
    Flux<PurchaseEntity> findByDateRange(LocalDate from, LocalDate to);

    @Query("SELECT * FROM purchases ORDER BY created_at DESC LIMIT :size OFFSET :offset")
    Flux<PurchaseEntity> findAllPaginated(int size, int offset);

    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(purchase_number, 4) AS INTEGER)), 0) + 1 FROM purchases WHERE purchase_number LIKE 'PO-%'")
    Mono<Integer> getNextNumber();
}
