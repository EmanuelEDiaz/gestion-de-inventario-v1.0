package com.inventory.domain.ports.out;

import com.inventory.domain.model.currency.ExchangeRate;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface ExchangeRateRepository {

    Mono<ExchangeRate> findById(UUID id);

    Flux<ExchangeRate> findAll();

    Flux<ExchangeRate> findByBasecodeAndQuotecode(String baseCode, String quoteCode);

    /** Returns the most recent entry for the given pair. */
    Mono<ExchangeRate> findLatest(String baseCode, String quoteCode);

    Mono<ExchangeRate> save(ExchangeRate exchangeRate);
}
