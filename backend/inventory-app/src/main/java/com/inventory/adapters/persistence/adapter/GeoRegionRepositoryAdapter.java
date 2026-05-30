package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.mapper.CatalogPersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.GeoRegionR2dbcRepository;
import com.inventory.domain.model.geo.GeoRegion;
import com.inventory.domain.ports.out.GeoRegionRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class GeoRegionRepositoryAdapter implements GeoRegionRepository {

    private final GeoRegionR2dbcRepository r2dbcRepository;
    private final CatalogPersistenceMapper mapper;

    public GeoRegionRepositoryAdapter(GeoRegionR2dbcRepository r2dbcRepository,
                                      CatalogPersistenceMapper mapper) {
        this.r2dbcRepository = r2dbcRepository;
        this.mapper = mapper;
    }

    @Override
    public Flux<GeoRegion> findByCountryCodeAndLevel(String countryCode, String level) {
        return r2dbcRepository.findByCountryCodeAndLevel(countryCode, level)
            .map(mapper::toDomain);
    }

    @Override
    public Flux<GeoRegion> findByParentId(UUID parentId) {
        return r2dbcRepository.findByParentId(parentId)
            .map(mapper::toDomain);
    }

    @Override
    public Mono<GeoRegion> findById(UUID id) {
        return r2dbcRepository.findById(id)
            .map(mapper::toDomain);
    }
}
