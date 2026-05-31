package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.entity.ExchangeRateEntity;
import com.inventory.adapters.persistence.adapter.repository.ExchangeRateR2dbcRepository;
import com.inventory.domain.model.currency.ExchangeRate;
import com.inventory.domain.ports.out.ExchangeRateRepository;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
public class ExchangeRateRepositoryAdapter implements ExchangeRateRepository {

    private final ExchangeRateR2dbcRepository r2dbc;

    public ExchangeRateRepositoryAdapter(ExchangeRateR2dbcRepository r2dbc) {
        this.r2dbc = r2dbc;
    }

    @Override
    public Mono<ExchangeRate> findById(UUID id) {
        return r2dbc.findById(id).map(this::toDomain);
    }

    @Override
    public Flux<ExchangeRate> findAll() {
        return r2dbc.findAll().map(this::toDomain);
    }

    @Override
    public Flux<ExchangeRate> findByBasecodeAndQuotecode(String baseCode, String quoteCode) {
        return r2dbc.findByBasecodeAndQuotecode(baseCode, quoteCode).map(this::toDomain);
    }

    @Override
    public Mono<ExchangeRate> findLatest(String baseCode, String quoteCode) {
        return r2dbc.findLatest(baseCode, quoteCode).map(this::toDomain);
    }

    @Override
    public Mono<ExchangeRate> save(ExchangeRate er) {
        return r2dbc.save(toEntity(er)).map(this::toDomain);
    }

    @Override
    public Mono<Void> deleteById(UUID id) {
        return r2dbc.deleteById(id);
    }

    private ExchangeRate toDomain(ExchangeRateEntity e) {
        return new ExchangeRate(
            e.getId(), e.getBaseCode(), e.getQuoteCode(), e.getRate(),
            ExchangeRate.RateType.valueOf(e.getRateType()),
            e.getValidFrom(), e.getCreatedBy(), e.getCreatedAt()
        );
    }

    private ExchangeRateEntity toEntity(ExchangeRate er) {
        return new ExchangeRateEntity(
            er.getId(), er.getBaseCode(), er.getQuoteCode(), er.getRate(),
            er.getRateType().name(), er.getValidFrom(), er.getCreatedBy(), er.getCreatedAt()
        );
    }
}
