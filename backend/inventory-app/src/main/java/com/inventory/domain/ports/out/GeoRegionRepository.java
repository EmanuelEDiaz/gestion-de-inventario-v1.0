package com.inventory.domain.ports.out;

import com.inventory.domain.model.geo.GeoRegion;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface GeoRegionRepository {

    Flux<GeoRegion> findByCountryCodeAndLevel(String countryCode, String level);

    Flux<GeoRegion> findByParentId(UUID parentId);

    Mono<GeoRegion> findById(UUID id);
}
