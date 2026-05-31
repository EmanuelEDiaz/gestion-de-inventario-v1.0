package com.inventory.domain.ports.in.currency;

import com.inventory.domain.model.currency.ExchangeRate;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public interface ExchangeRateCommandPort {

    Mono<ExchangeRate> create(CreateExchangeRateCommand command);

    Mono<ExchangeRate> update(UUID id, UpdateExchangeRateCommand command);

    Mono<Void> delete(UUID id);

    // ===== Command Records =====

    record CreateExchangeRateCommand(
        String baseCode,
        String quoteCode,
        BigDecimal rate,
        String rateType,
        Instant validFrom,
        UUID createdBy
    ) {}

    record UpdateExchangeRateCommand(
        BigDecimal rate,
        String rateType,
        Instant validFrom
    ) {}
}
