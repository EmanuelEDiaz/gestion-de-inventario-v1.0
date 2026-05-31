package com.inventory.application.usecase.command.currency;

import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.currency.ExchangeRate;
import com.inventory.domain.ports.in.currency.ExchangeRateCommandPort;
import com.inventory.domain.ports.out.ExchangeRateRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
public class ExchangeRateCommandUseCase implements ExchangeRateCommandPort {

    private final ExchangeRateRepository repository;

    public ExchangeRateCommandUseCase(ExchangeRateRepository repository) {
        this.repository = repository;
    }

    @Override
    public Mono<ExchangeRate> create(CreateExchangeRateCommand command) {
        ExchangeRate.RateType rateType = parseRateType(command.rateType());

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

    @Override
    public Mono<ExchangeRate> update(UUID id, UpdateExchangeRateCommand command) {
        return repository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Tasa de cambio no encontrada")))
            .map(existing -> existing.withRate(
                command.rate(),
                parseRateType(command.rateType()),
                command.validFrom() != null ? command.validFrom() : existing.getValidFrom()
            ))
            .flatMap(repository::save);
    }

    @Override
    public Mono<Void> delete(UUID id) {
        return repository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Tasa de cambio no encontrada")))
            .flatMap(existing -> repository.deleteById(existing.getId()));
    }

    private static ExchangeRate.RateType parseRateType(String rateType) {
        return rateType != null
            ? ExchangeRate.RateType.valueOf(rateType.toUpperCase())
            : ExchangeRate.RateType.OFFICIAL;
    }
}
