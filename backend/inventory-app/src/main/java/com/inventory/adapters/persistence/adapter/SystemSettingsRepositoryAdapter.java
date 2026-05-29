package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.repository.SystemSettingsR2dbcRepository;
import com.inventory.domain.ports.out.SystemSettingsRepository;
import com.inventory.domain.model.settings.SystemSetting;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class SystemSettingsRepositoryAdapter implements SystemSettingsRepository {

    private final SystemSettingsR2dbcRepository r2dbcRepository;

    public SystemSettingsRepositoryAdapter(SystemSettingsR2dbcRepository r2dbcRepository) {
        this.r2dbcRepository = r2dbcRepository;
    }

    @Override
    public Mono<SystemSetting> findByKey(String key) {
        return r2dbcRepository.findByKey(key)
            .map(e -> new SystemSetting(
                e.getKey(), e.getValue(), e.getValueType(),
                e.getDescription(), e.isPublic(), e.getUpdatedAt()));
    }

    @Override
    public Flux<SystemSetting> findAll() {
        return r2dbcRepository.findAll()
            .map(e -> new SystemSetting(
                e.getKey(), e.getValue(), e.getValueType(),
                e.getDescription(), e.isPublic(), e.getUpdatedAt()));
    }

    @Override
    public Mono<Void> update(String key, String value, UUID updatedBy) {
        return r2dbcRepository.findByKey(key)
            .flatMap(entity -> {
                entity.setValue(value);
                entity.setUpdatedBy(updatedBy);
                return r2dbcRepository.save(entity);
            })
            .then();
    }
}
