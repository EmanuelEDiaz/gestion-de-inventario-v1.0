package com.inventory.application.usecase.command.currency;

import com.inventory.domain.model.currency.ExchangeRate;
import com.inventory.domain.ports.in.currency.ExchangeRateCommandPort;
import com.inventory.domain.ports.out.ExchangeRateRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
public class ExchangeRateCommandUseCase implements ExchangeRateCommandPort {

    private final ExchangeRateRepository repository;

    public ExchangeRateCommandUseCase(ExchangeRateRepository repository) {
        this.repository = repository;
    }

    @Override
    public Mono<ExchangeRate> create(CreateExchangeRateCommand command) {
        ExchangeRate.RateType rateType = command.rateType() != null
            ? ExchangeRate.RateType.valueOf(command.rateType().toUpperCase())
            : ExchangeRate.RateType.OFFICIAL;

        ExchangeRate entity = ExchangeRate.create(
            command.baseCode(),
            command.quoteCode(),
            command.rate(),
            rateType,
            command.validFrom(),
            command.createdBy()
        );
        return repository.save(entity);
    }
}
