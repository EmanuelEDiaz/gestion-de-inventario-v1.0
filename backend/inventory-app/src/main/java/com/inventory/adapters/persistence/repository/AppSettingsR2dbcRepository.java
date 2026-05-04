package com.inventory.adapters.persistence.repository;

import com.inventory.adapters.persistence.entity.AppSettingsEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

/**
 * Repositorio R2DBC para app_settings (singleton id = 'global').
 */
public interface AppSettingsR2dbcRepository extends ReactiveCrudRepository<AppSettingsEntity, String> {
}
