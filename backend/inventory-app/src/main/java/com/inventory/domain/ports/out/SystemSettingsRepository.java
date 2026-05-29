package com.inventory.domain.ports.out;

import com.inventory.domain.model.settings.SystemSetting;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface SystemSettingsRepository {
    Mono<SystemSetting> findByKey(String key);
    Flux<SystemSetting> findAll();
    Mono<Void> update(String key, String value, UUID updatedBy);
}
