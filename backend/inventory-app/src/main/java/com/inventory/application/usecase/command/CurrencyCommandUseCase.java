package com.inventory.application.usecase.command;

import com.inventory.domain.model.Currency;
import com.inventory.domain.ports.in.CurrencyCommandPort;
import com.inventory.domain.ports.out.CurrencyRepositoryPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class CurrencyCommandUseCase implements CurrencyCommandPort {

    private final CurrencyRepositoryPort repository;

    public CurrencyCommandUseCase(CurrencyRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public Mono<Currency> create(CreateCurrencyCommand command) {
        return repository.save(Currency.create(command.code(), command.name(), command.symbol()));
    }

    @Override
    public Mono<Currency> update(String code, UpdateCurrencyCommand command) {
        return repository.findByCode(code.toUpperCase())
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Currency not found: " + code)))
            .flatMap(existing -> {
                String newName   = command.name()     != null ? command.name()     : existing.getName();
                String newSymbol = command.symbol()   != null ? command.symbol()   : existing.getSymbol();
                boolean active   = command.isActive() != null ? command.isActive() : existing.isActive();
                Currency updated = new Currency(existing.getCode(), newName, newSymbol, active, existing.getCreatedAt());
                return repository.save(updated);
            });
    }
}
