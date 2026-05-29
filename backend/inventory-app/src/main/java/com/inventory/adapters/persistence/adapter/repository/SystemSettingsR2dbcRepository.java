package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.SystemSettingEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

public interface SystemSettingsR2dbcRepository extends ReactiveCrudRepository<SystemSettingEntity, String> {

    Mono<SystemSettingEntity> findByKey(String key);
}
