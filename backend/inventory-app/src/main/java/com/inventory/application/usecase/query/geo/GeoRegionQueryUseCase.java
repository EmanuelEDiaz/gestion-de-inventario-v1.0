package com.inventory.application.usecase.query.geo;

import com.inventory.domain.model.geo.GeoRegion;
import com.inventory.domain.ports.out.GeoRegionRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.UUID;

@Service
public class GeoRegionQueryUseCase {

    private final GeoRegionRepository geoRegionRepository;

    public GeoRegionQueryUseCase(GeoRegionRepository geoRegionRepository) {
        this.geoRegionRepository = geoRegionRepository;
    }

    public Flux<GeoRegion> getProvinces(String countryCode) {
        return geoRegionRepository.findByCountryCodeAndLevel(countryCode, "province");
    }

    public Flux<GeoRegion> getMunicipalities(UUID provinceId) {
        return geoRegionRepository.findByParentId(provinceId);
    }
}
