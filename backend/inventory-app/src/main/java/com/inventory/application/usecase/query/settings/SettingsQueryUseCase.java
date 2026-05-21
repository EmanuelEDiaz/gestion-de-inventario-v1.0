package com.inventory.application.usecase.query.settings;

import com.inventory.domain.model.settings.AppSettings;
import com.inventory.domain.ports.out.AppSettingsRepositoryPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

/**
 * Caso de uso: Obtener la configuración global del sistema.
 */
@Service
public class SettingsQueryUseCase {

    private final AppSettingsRepositoryPort repository;

    public SettingsQueryUseCase(AppSettingsRepositoryPort repository) {
        this.repository = repository;
    }

    public Mono<AppSettings> execute() {
        return repository.find();
    }
}
