package com.inventory.domain.ports.in.currency;

import com.inventory.domain.model.currency.Currency;
import reactor.core.publisher.Mono;

public interface CurrencyCommandPort {

    Mono<Currency> create(CreateCurrencyCommand command);

    Mono<Currency> update(String code, UpdateCurrencyCommand command);

    // ===== Command Records =====

    record CreateCurrencyCommand(
        String code,
        String name,
        String symbol
    ) {}

    record UpdateCurrencyCommand(
        String name,
        String symbol,
        Boolean isActive
    ) {}
}
