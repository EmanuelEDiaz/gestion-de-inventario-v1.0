package com.inventory.domain.ports.out;

import com.inventory.domain.model.ExchangeRate;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ExchangeRateRepository {

    Mono<ExchangeRate> findById(String id);

    Flux<ExchangeRate> findAll();

    Flux<ExchangeRate> findAllActive();

    Mono<ExchangeRate> findActiveRate(String fromCurrency, String toCurrency);

    Flux<ExchangeRate> findHistory(String fromCurrency, String toCurrency);

    Mono<ExchangeRate> save(ExchangeRate exchangeRate);

    Mono<ExchangeRate> delete(ExchangeRate exchangeRate);

    Mono<ExchangeRate> deleteById(String id);
}