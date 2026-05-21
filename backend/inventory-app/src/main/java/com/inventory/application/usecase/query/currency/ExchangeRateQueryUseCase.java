package com.inventory.application.usecase.query.currency;

import com.inventory.domain.model.currency.ExchangeRate;
import com.inventory.domain.ports.in.currency.ExchangeRateQueryPort;
import com.inventory.domain.ports.out.ExchangeRateRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class ExchangeRateQueryUseCase implements ExchangeRateQueryPort {

    private final ExchangeRateRepository repository;

    public ExchangeRateQueryUseCase(ExchangeRateRepository repository) {
        this.repository = repository;
    }

    @Override
    public Flux<ExchangeRate> findAll(String baseCode, String quoteCode, String rateType) {
        Flux<ExchangeRate> all = (baseCode != null && quoteCode != null)
            ? repository.findByBasecodeAndQuotecode(baseCode.toUpperCase(), quoteCode.toUpperCase())
            : repository.findAll();

        if (rateType != null) {
            ExchangeRate.RateType type = ExchangeRate.RateType.valueOf(rateType.toUpperCase());
            all = all.filter(r -> r.getRateType() == type);
        }
        return all;
    }

    @Override
    public Mono<ExchangeRate> findLatest(String baseCode, String quoteCode) {
        return repository.findLatest(baseCode.toUpperCase(), quoteCode.toUpperCase());
    }
}
