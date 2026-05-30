package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.GeoRegionEntity;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface GeoRegionR2dbcRepository extends ReactiveCrudRepository<GeoRegionEntity, UUID> {

    Flux<GeoRegionEntity> findByCountryCodeAndLevel(String countryCode, String level);

    Flux<GeoRegionEntity> findByParentId(UUID parentId);
}
