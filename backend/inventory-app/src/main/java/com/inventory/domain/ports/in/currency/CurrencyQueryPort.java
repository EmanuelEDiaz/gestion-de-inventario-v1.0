package com.inventory.domain.ports.in.currency;

import com.inventory.domain.model.currency.Currency;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CurrencyQueryPort {

    Flux<Currency> findAll();

    Mono<Currency> findByCode(String code);
}
