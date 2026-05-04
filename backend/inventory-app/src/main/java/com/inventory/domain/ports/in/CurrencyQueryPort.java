package com.inventory.domain.ports.in;

import com.inventory.domain.model.Currency;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CurrencyQueryPort {

    Flux<Currency> findAll();

    Mono<Currency> findByCode(String code);
}
