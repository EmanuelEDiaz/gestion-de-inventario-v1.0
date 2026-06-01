package com.inventory.application.usecase.command.currency;

import com.inventory.application.shared.AuditLogger;
import com.inventory.application.shared.AuditSerializer;
import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.currency.Currency;
import com.inventory.domain.ports.in.currency.CurrencyCommandPort;
import com.inventory.domain.ports.out.CurrencyRepositoryPort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
public class CurrencyCommandUseCase implements CurrencyCommandPort {

    private final CurrencyRepositoryPort repository;
    private final AuditLogger auditLogger;
    private final AuditSerializer auditSerializer;
    private static final Logger log = LoggerFactory.getLogger(CurrencyCommandUseCase.class);

    public CurrencyCommandUseCase(CurrencyRepositoryPort repository,
                                  AuditLogger auditLogger,
                                  AuditSerializer auditSerializer) {
        this.repository = repository;
        this.auditLogger = auditLogger;
        this.auditSerializer = auditSerializer;
    }

    @Override
    public Mono<Currency> create(CreateCurrencyCommand command, UUID userId) {
        return repository.save(Currency.create(command.code(), command.name(), command.symbol()))
            .flatMap(saved -> auditLogger.log(userId, "CURRENCY", null, "CREATE",
                null, auditSerializer.toJsonTruncated(saved))
                .onErrorResume(e -> {
                    log.warn("Audit log failed for currency {}: {}", saved.getCode(), e.getMessage());
                    return Mono.empty();
                })
                .thenReturn(saved));
    }

    @Override
    public Mono<Currency> update(String code, UpdateCurrencyCommand command, UUID userId) {
        return repository.findByCode(code.toUpperCase())
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Currency not found: " + code)))
            .flatMap(existing -> {
                String newName   = command.name()     != null ? command.name()     : existing.getName();
                String newSymbol = command.symbol()   != null ? command.symbol()   : existing.getSymbol();
                boolean active   = command.isActive() != null ? command.isActive() : existing.isActive();
                Currency updated = new Currency(existing.getCode(), newName, newSymbol, active, existing.getCreatedAt());
                return repository.save(updated)
                    .flatMap(saved -> auditLogger.log(userId, "CURRENCY", null, "UPDATE",
                        auditSerializer.toJsonTruncated(existing), auditSerializer.toJsonTruncated(saved))
                        .onErrorResume(e -> {
                            log.warn("Audit log failed for currency {}: {}", saved.getCode(), e.getMessage());
                            return Mono.empty();
                        })
                        .thenReturn(saved));
            });
    }

    @Override
    public Mono<Void> delete(String code, UUID userId) {
        return repository.findByCode(code.toUpperCase())
            .switchIfEmpty(Mono.error(new NotFoundException("Moneda no encontrada: " + code)))
            .flatMap(existing -> auditLogger.log(userId, "CURRENCY", null, "DELETE",
                auditSerializer.toJsonTruncated(existing), null)
                .onErrorResume(e -> {
                    log.warn("Audit log failed for currency {}: {}", existing.getCode(), e.getMessage());
                    return Mono.empty();
                })
                .then(repository.deleteByCode(existing.getCode())));
    }
}
