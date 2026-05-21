package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.entity.AppSettingsEntity;
import com.inventory.adapters.persistence.adapter.mapper.AppSettingsPersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.AppSettingsR2dbcRepository;
import com.inventory.domain.model.settings.AppSettings;
import com.inventory.domain.ports.out.AppSettingsRepositoryPort;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.time.Instant;

/**
 * Adaptador de persistencia para app_settings.
 *
 * El registro siempre existe con id='global' (INSERT en seed de Flyway).
 * Se usa save() directamente — R2DBC maneja el UPDATE con @Version.
 */
@Repository
public class AppSettingsPersistenceAdapter implements AppSettingsRepositoryPort {

    private static final String SETTINGS_ID = "global";

    private final AppSettingsR2dbcRepository r2dbcRepository;
    private final AppSettingsPersistenceMapper mapper;

    public AppSettingsPersistenceAdapter(AppSettingsR2dbcRepository r2dbcRepository,
                                          AppSettingsPersistenceMapper mapper) {
        this.r2dbcRepository = r2dbcRepository;
        this.mapper = mapper;
    }

    @Override
    public Mono<AppSettings> find() {
        return r2dbcRepository.findById(SETTINGS_ID)
                .switchIfEmpty(Mono.defer(this::createDefault))
                .map(mapper::toDomain);
    }

    @Override
    public Mono<AppSettings> save(AppSettings settings) {
        AppSettingsEntity entity = mapper.toEntity(settings);
        return r2dbcRepository.save(entity)
                .map(mapper::toDomain);
    }

    /** Crea el registro global si no existe (fallback; normalmente lo inserta Flyway). */
    private Mono<AppSettingsEntity> createDefault() {
        AppSettingsEntity defaults = new AppSettingsEntity();
        defaults.setId(SETTINGS_ID);
        defaults.setDefaultCostMethod("STANDARD");
        defaults.setDefaultCurrencyCode("CUP");
        defaults.setUpdatedAt(Instant.now());
        defaults.setVersion(0);
        return r2dbcRepository.save(defaults);
    }
}
