package com.inventory.application.usecase.command.currency;

import com.inventory.application.shared.AuditLogger;
import com.inventory.application.shared.AuditSerializer;
import com.inventory.domain.errors.ConflictException;
import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.currency.ExchangeRate;
import com.inventory.domain.ports.in.currency.ExchangeRateCommandPort;
import com.inventory.domain.ports.out.ExchangeRateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
public class ExchangeRateCommandUseCase implements ExchangeRateCommandPort {

    private final ExchangeRateRepository repository;
    private final AuditLogger auditLogger;
    private final AuditSerializer auditSerializer;
    private static final Logger log = LoggerFactory.getLogger(ExchangeRateCommandUseCase.class);

    public ExchangeRateCommandUseCase(ExchangeRateRepository repository,
                                      AuditLogger auditLogger,
                                      AuditSerializer auditSerializer) {
        this.repository = repository;
        this.auditLogger = auditLogger;
        this.auditSerializer = auditSerializer;
    }

    @Override
    public Mono<ExchangeRate> create(CreateExchangeRateCommand command) {
        ExchangeRate.RateType rateType = parseRateType(command.rateType());

        return repository.existsByPair(command.baseCode(), command.quoteCode())
            .flatMap(exists -> {
                if (exists) {
                    return Mono.error(new ConflictException(
                        "Ya existe una tasa para el par " + command.baseCode() + "/" + command.quoteCode()
                    ));
                }
                ExchangeRate entity = ExchangeRate.create(
                    command.baseCode(),
                    command.quoteCode(),
                    command.rate(),
                    rateType,
                    command.validFrom(),
                    command.createdBy()
                );
                return repository.save(entity);
            })
            .flatMap(saved -> {
                UUID actorId = command.createdBy();
                return auditLogger.log(actorId, "EXCHANGE_RATE", saved.getId(), "CREATE",
                    null, auditSerializer.toJsonTruncated(saved))
                    .onErrorResume(e -> {
                        log.warn("Audit log failed for exchange rate {}: {}", saved.getId(), e.getMessage());
                        return Mono.empty();
                    })
                    .thenReturn(saved);
            });
    }

    @Override
    public Mono<ExchangeRate> update(UUID id, UpdateExchangeRateCommand command, UUID userId) {
        return repository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Tasa de cambio no encontrada")))
            .flatMap(existing -> {
                ExchangeRate updated = existing.withRate(
                    command.rate(),
                    parseRateType(command.rateType()),
                    command.validFrom() != null ? command.validFrom() : existing.getValidFrom()
                );
                return repository.save(updated)
                    .flatMap(saved -> auditLogger.log(userId, "EXCHANGE_RATE", saved.getId(), "UPDATE",
                        auditSerializer.toJsonTruncated(existing), auditSerializer.toJsonTruncated(saved))
                        .onErrorResume(e -> {
                            log.warn("Audit log failed for exchange rate {}: {}", saved.getId(), e.getMessage());
                            return Mono.empty();
                        })
                        .thenReturn(saved));
            });
    }

    @Override
    public Mono<Void> delete(UUID id, UUID userId) {
        return repository.findById(id)
            .switchIfEmpty(Mono.error(new NotFoundException("Tasa de cambio no encontrada")))
            .flatMap(existing -> auditLogger.log(userId, "EXCHANGE_RATE", existing.getId(), "DELETE",
                auditSerializer.toJsonTruncated(existing), null)
                .onErrorResume(e -> {
                    log.warn("Audit log failed for exchange rate {}: {}", existing.getId(), e.getMessage());
                    return Mono.empty();
                })
                .then(repository.deleteById(existing.getId())));
    }

    private static ExchangeRate.RateType parseRateType(String rateType) {
        return rateType != null
            ? ExchangeRate.RateType.valueOf(rateType.toUpperCase())
            : ExchangeRate.RateType.OFFICIAL;
    }
}
