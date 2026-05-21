package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.ExchangeRateEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface ExchangeRateR2dbcRepository extends ReactiveCrudRepository<ExchangeRateEntity, UUID> {

    @Query("SELECT * FROM exchange_rates WHERE base_code = :baseCode AND quote_code = :quoteCode")
    Flux<ExchangeRateEntity> findByBasecodeAndQuotecode(String baseCode, String quoteCode);

    @Query("SELECT * FROM exchange_rates WHERE base_code = :baseCode AND quote_code = :quoteCode ORDER BY valid_from DESC LIMIT 1")
    Mono<ExchangeRateEntity> findLatest(String baseCode, String quoteCode);
}
