package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.CustomerDebtEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

public interface R2dbcCustomerDebtRepository extends ReactiveCrudRepository<CustomerDebtEntity, UUID> {

    @Query("SELECT * FROM customer_debts WHERE customer_id = :customerId ORDER BY created_at DESC")
    Flux<CustomerDebtEntity> findByCustomerId(UUID customerId);

    @Query("SELECT * FROM customer_debts WHERE sale_id = :saleId")
    Flux<CustomerDebtEntity> findBySaleId(UUID saleId);

    @Query("SELECT * FROM customer_debts WHERE customer_id = :customerId AND status IN ('PENDING','PARTIAL') ORDER BY due_date ASC")
    Flux<CustomerDebtEntity> findPendingByCustomerId(UUID customerId);

    @Query("SELECT * FROM customer_debts WHERE status = :status ORDER BY created_at DESC")
    Flux<CustomerDebtEntity> findByStatus(String status);

    @Query("SELECT * FROM customer_debts WHERE status IN ('PENDING','PARTIAL') AND due_date < :now ORDER BY due_date ASC")
    Flux<CustomerDebtEntity> findOverdue(Instant now);
}
