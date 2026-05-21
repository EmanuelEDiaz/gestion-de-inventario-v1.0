package com.inventory.application.usecase.query;

import com.inventory.domain.model.currency.Currency;
import com.inventory.domain.ports.in.CurrencyQueryPort;
import com.inventory.domain.ports.out.CurrencyRepositoryPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class CurrencyQueryUseCase implements CurrencyQueryPort {

    private final CurrencyRepositoryPort repository;

    public CurrencyQueryUseCase(CurrencyRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public Flux<Currency> findAll() {
        return repository.findAll();
    }

    @Override
    public Mono<Currency> findByCode(String code) {
        return repository.findByCode(code.toUpperCase());
    }
}
