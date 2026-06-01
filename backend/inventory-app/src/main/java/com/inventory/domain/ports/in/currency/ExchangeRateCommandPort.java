package com.inventory.domain.ports.in.currency;

import com.inventory.domain.model.currency.ExchangeRate;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public interface ExchangeRateCommandPort {

    Mono<ExchangeRate> create(CreateExchangeRateCommand command);

    Mono<ExchangeRate> update(UUID id, UpdateExchangeRateCommand command, java.util.UUID userId);

    Mono<Void> delete(UUID id, java.util.UUID userId);

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
