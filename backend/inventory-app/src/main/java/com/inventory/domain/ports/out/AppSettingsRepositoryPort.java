package com.inventory.domain.ports.out;

import com.inventory.domain.model.AppSettings;
import reactor.core.publisher.Mono;

/**
 * Puerto de salida: Repositorio de configuración global del sistema.
 */
public interface AppSettingsRepositoryPort {

    /** Devuelve la configuración actual (siempre existe el singleton 'global'). */
    Mono<AppSettings> find();

    /** Persiste los cambios y retorna la configuración actualizada. */
    Mono<AppSettings> save(AppSettings settings);
}
