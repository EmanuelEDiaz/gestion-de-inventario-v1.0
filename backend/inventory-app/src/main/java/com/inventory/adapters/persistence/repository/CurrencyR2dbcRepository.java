package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.CurrencyEntity;
import org.springframework.data.r2dbc.repository.R2dbcRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;

@Repository
public interface CurrencyR2dbcRepository extends R2dbcRepository<CurrencyEntity, String> {

    Flux<CurrencyEntity> findByIsActiveTrue();
}
