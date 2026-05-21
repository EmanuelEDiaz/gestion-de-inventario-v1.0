package com.inventory.domain.ports.out;

import com.inventory.domain.model.currency.Currency;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface CurrencyRepositoryPort {

    Flux<Currency> findAll();

    Flux<Currency> findAllActive();

    Mono<Currency> findByCode(String code);

    Mono<Currency> save(Currency currency);
}
