package com.inventory.adapters.web.controller.geo;

import com.inventory.adapters.web.dto.geo.GeoRegionResponse;
import com.inventory.application.usecase.query.geo.GeoRegionQueryUseCase;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/geo")
public class GeoRegionController {

    private final GeoRegionQueryUseCase geoRegionQuery;

    public GeoRegionController(GeoRegionQueryUseCase geoRegionQuery) {
        this.geoRegionQuery = geoRegionQuery;
    }

    @GetMapping("/provinces")
    @PreAuthorize("permitAll()")
    public Flux<GeoRegionResponse> getProvinces(@RequestParam String countryCode) {
        return geoRegionQuery.getProvinces(countryCode)
            .map(this::toResponse);
    }

    @GetMapping("/municipalities/{provinceId}")
    @PreAuthorize("permitAll()")
    public Flux<GeoRegionResponse> getMunicipalities(@PathVariable UUID provinceId) {
        return geoRegionQuery.getMunicipalities(provinceId)
            .map(this::toResponse);
    }

    private GeoRegionResponse toResponse(com.inventory.domain.model.geo.GeoRegion domain) {
        return new GeoRegionResponse(
            domain.getId(),
            domain.getCountryCode(),
            domain.getLevel(),
            domain.getName(),
            domain.getLatitude(),
            domain.getLongitude(),
            domain.isActive()
        );
    }
}
