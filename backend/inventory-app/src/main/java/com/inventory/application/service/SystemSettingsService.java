package com.inventory.application.service;

import com.inventory.adapters.web.dto.settings.SystemSettingResponse;
import com.inventory.domain.ports.out.SystemSettingsRepository;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
public class SystemSettingsService {

    private final CacheManager cacheManager;
    private final SystemSettingsRepository repository;

    public SystemSettingsService(CacheManager cacheManager, SystemSettingsRepository repository) {
        this.cacheManager = cacheManager;
        this.repository = repository;
    }

    public Mono<Integer> getInt(String key, int defaultValue) {
        Cache cache = cacheManager.getCache("system-settings");
        Integer cached = cache != null ? cache.get(key, Integer.class) : null;
        if (cached != null) return Mono.just(cached);
        return repository.findByKey(key)
            .map(s -> Integer.parseInt(s.value()))
            .defaultIfEmpty(defaultValue)
            .doOnNext(v -> { if (cache != null) cache.put(key, v); });
    }

    public Mono<Void> update(String key, String value, UUID updatedBy) {
        return repository.update(key, value, updatedBy)
            .doOnSuccess(ignore -> {
                Cache cache = cacheManager.getCache("system-settings");
                if (cache != null) cache.clear();
            });
    }

    public Flux<SystemSettingResponse> getAll() {
        return repository.findAll()
            .map(s -> new SystemSettingResponse(
                s.key(), s.value(), s.valueType(),
                s.description(), s.isPublic(), s.updatedAt()));
    }
}
