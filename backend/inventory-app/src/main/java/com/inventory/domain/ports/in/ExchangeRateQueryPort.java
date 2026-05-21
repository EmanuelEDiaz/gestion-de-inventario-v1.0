package com.inventory.domain.ports.in;

import com.inventory.domain.model.currency.ExchangeRate;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ExchangeRateQueryPort {

    Flux<ExchangeRate> findAll(String baseCode, String quoteCode, String rateType);

    Mono<ExchangeRate> findLatest(String baseCode, String quoteCode);
}
