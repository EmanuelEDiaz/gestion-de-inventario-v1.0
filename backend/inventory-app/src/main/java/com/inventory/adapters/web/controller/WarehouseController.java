package com.inventory.adapters.web.controller;

import com.inventory.adapters.web.dto.*;
import com.inventory.adapters.web.mapper.CatalogWebMapper;
import com.inventory.domain.model.Warehouse;
import com.inventory.domain.ports.out.WarehouseRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/warehouses")
public class WarehouseController {

    private final WarehouseRepository warehouseRepository;
    private final CatalogWebMapper mapper;

    public WarehouseController(WarehouseRepository warehouseRepository, CatalogWebMapper mapper) {
        this.warehouseRepository = warehouseRepository;
        this.mapper = mapper;
    }

    @GetMapping
    public Flux<WarehouseResponse> getAll(@RequestParam(defaultValue = "false") boolean activeOnly) {
        Flux<Warehouse> warehouses = activeOnly 
            ? warehouseRepository.findAllActive() 
            : warehouseRepository.findAll();
        return warehouses.map(mapper::toResponse);
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<WarehouseResponse>> getById(@PathVariable UUID id) {
        return warehouseRepository.findById(id)
            .map(warehouse -> ResponseEntity.ok(mapper.toResponse(warehouse)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/code/{code}")
    public Mono<ResponseEntity<WarehouseResponse>> getByCode(@PathVariable String code) {
        return warehouseRepository.findByCode(code)
            .map(warehouse -> ResponseEntity.ok(mapper.toResponse(warehouse)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Mono<ResponseEntity<WarehouseResponse>> create(@Valid @RequestBody CreateWarehouseRequest request) {
        return warehouseRepository.existsByCode(request.code())
            .flatMap(exists -> {
                if (exists) {
                    return Mono.just(ResponseEntity.status(HttpStatus.CONFLICT)
                        .<WarehouseResponse>build());
                }
                Warehouse warehouse = mapper.toDomain(request);
                return warehouseRepository.save(warehouse)
                    .map(saved -> ResponseEntity.status(HttpStatus.CREATED)
                        .body(mapper.toResponse(saved)));
            });
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<WarehouseResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWarehouseRequest request) {
        return warehouseRepository.findById(id)
            .flatMap(existing -> {
                Warehouse updated = existing.update(request.name(), request.address());
                if (request.active() != null) {
                    updated = request.active() ? updated.activate() : updated.deactivate();
                }
                return warehouseRepository.save(updated)
                    .map(saved -> ResponseEntity.ok(mapper.toResponse(saved)));
            })
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> delete(@PathVariable UUID id) {
        return warehouseRepository.findById(id)
            .flatMap(existing -> warehouseRepository.deleteById(id)
                .then(Mono.just(ResponseEntity.noContent().<Void>build())))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/deactivate")
    public Mono<ResponseEntity<WarehouseResponse>> deactivate(@PathVariable UUID id) {
        return warehouseRepository.findById(id)
            .flatMap(existing -> {
                Warehouse deactivated = existing.deactivate();
                return warehouseRepository.save(deactivated)
                    .map(saved -> ResponseEntity.ok(mapper.toResponse(saved)));
            })
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/activate")
    public Mono<ResponseEntity<WarehouseResponse>> activate(@PathVariable UUID id) {
        return warehouseRepository.findById(id)
            .flatMap(existing -> {
                Warehouse activated = existing.activate();
                return warehouseRepository.save(activated)
                    .map(saved -> ResponseEntity.ok(mapper.toResponse(saved)));
            })
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }
}
