package com.inventory.adapters.persistence;

import com.inventory.adapters.persistence.entity.CurrencyEntity;
import com.inventory.adapters.persistence.repository.CurrencyR2dbcRepository;
import com.inventory.domain.model.Currency;
import com.inventory.domain.ports.out.CurrencyRepositoryPort;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Component
public class CurrencyRepositoryAdapter implements CurrencyRepositoryPort {

    private final CurrencyR2dbcRepository r2dbc;

    public CurrencyRepositoryAdapter(CurrencyR2dbcRepository r2dbc) {
        this.r2dbc = r2dbc;
    }

    @Override
    public Flux<Currency> findAll() {
        return r2dbc.findAll().map(this::toDomain);
    }

    @Override
    public Flux<Currency> findAllActive() {
        return r2dbc.findByIsActiveTrue().map(this::toDomain);
    }

    @Override
    public Mono<Currency> findByCode(String code) {
        return r2dbc.findById(code).map(this::toDomain);
    }

    @Override
    public Mono<Currency> save(Currency currency) {
        return r2dbc.save(toEntity(currency)).map(this::toDomain);
    }

    private Currency toDomain(CurrencyEntity e) {
        return new Currency(e.getCode(), e.getName(), e.getSymbol(), e.isActive(), null);
    }

    private CurrencyEntity toEntity(Currency c) {
        return new CurrencyEntity(c.getCode(), c.getName(), c.getSymbol(), c.isActive());
    }
}
