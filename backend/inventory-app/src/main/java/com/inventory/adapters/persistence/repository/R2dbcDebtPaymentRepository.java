package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.DebtPaymentEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface R2dbcDebtPaymentRepository extends ReactiveCrudRepository<DebtPaymentEntity, UUID> {

    @Query("SELECT * FROM debt_payments WHERE debt_id = :debtId ORDER BY created_at ASC")
    Flux<DebtPaymentEntity> findByDebtId(UUID debtId);
}
