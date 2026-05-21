package com.inventory.application.usecase.command;

import com.inventory.domain.errors.InvalidSettingsValueException;
import com.inventory.domain.errors.SettingsVersionConflictException;
import com.inventory.domain.model.settings.AppSettings;
import com.inventory.domain.model.settings.AppSettings.CostMethod;
import com.inventory.domain.ports.out.AppSettingsRepositoryPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Caso de uso: Actualizar la configuración global del sistema.
 *
 * Implementa optimistic locking con If-Match/ETag:
 * si la versión del cliente no coincide con la actual, lanza
 * SettingsVersionConflictException (HTTP 409) con mensaje descriptivo.
 */
@Service
public class UpdateSettingsUseCase {

    private final AppSettingsRepositoryPort repository;

    public UpdateSettingsUseCase(AppSettingsRepositoryPort repository) {
        this.repository = repository;
    }

    public record Command(
            Integer clientVersion,
            CostMethod defaultCostMethod,
            String defaultCurrencyCode,
            String companyName,
            BigDecimal lowStockThresholdDefault,
            UUID actorId
    ) {}

    public Mono<AppSettings> execute(Command command) {
        return repository.find()
                .flatMap(current -> {
                    // Optimistic lock: rechaza si la versión del cliente está desactualizada
                    if (command.clientVersion() != null &&
                            command.clientVersion() != current.getVersion()) {
                        return Mono.error(new SettingsVersionConflictException(
                                command.clientVersion(), current.getVersion()));
                    }

                    // Validaciones de negocio
                    if (command.defaultCurrencyCode() != null) {
                        String code = command.defaultCurrencyCode().trim();
                        if (code.length() != 3 || !code.matches("[A-Z]{3}")) {
                            return Mono.error(new InvalidSettingsValueException(
                                    "defaultCurrencyCode",
                                    "debe ser un código ISO 4217 de 3 letras mayúsculas (ej. CUP, USD, EUR)"));
                        }
                    }

                    if (command.lowStockThresholdDefault() != null &&
                            command.lowStockThresholdDefault().compareTo(BigDecimal.ZERO) < 0) {
                        return Mono.error(new InvalidSettingsValueException(
                                "lowStockThresholdDefault",
                                "el umbral de stock bajo no puede ser negativo"));
                    }

                    if (command.companyName() != null && command.companyName().trim().length() > 200) {
                        return Mono.error(new InvalidSettingsValueException(
                                "companyName",
                                "el nombre de la empresa no puede superar los 200 caracteres"));
                    }

                    AppSettings updated = current.applyUpdate(
                            command.defaultCostMethod(),
                            command.defaultCurrencyCode() != null
                                    ? command.defaultCurrencyCode().trim().toUpperCase()
                                    : null,
                            command.companyName() != null
                                    ? command.companyName().trim()
                                    : null,
                            command.lowStockThresholdDefault(),
                            command.actorId()
                    );

                    return repository.save(updated);
                });
    }
}
