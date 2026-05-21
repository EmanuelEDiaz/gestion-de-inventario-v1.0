package com.inventory.adapters.web.controller;

import com.inventory.adapters.web.dto.*;
import com.inventory.adapters.web.mapper.CatalogWebMapper;
import com.inventory.domain.ports.in.warehouse.WarehouseCommandPort;
import com.inventory.domain.ports.in.warehouse.WarehouseQueryPort;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Controller REST para Almacenes.
 * Delega lógica de negocio a Use Cases (Ports de entrada).
 */
@RestController
@RequestMapping("/api/v1/warehouses")
public class WarehouseController {

    private final WarehouseQueryPort warehouseQuery;
    private final WarehouseCommandPort warehouseCommand;
    private final CatalogWebMapper mapper;

    public WarehouseController(
            WarehouseQueryPort warehouseQuery,
            WarehouseCommandPort warehouseCommand,
            CatalogWebMapper mapper) {
        this.warehouseQuery = warehouseQuery;
        this.warehouseCommand = warehouseCommand;
        this.mapper = mapper;
    }

    @GetMapping
    public Flux<WarehouseResponse> getAll(@RequestParam(defaultValue = "false") boolean activeOnly) {
        return warehouseQuery.findAll(activeOnly)
            .map(mapper::toResponse);
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<WarehouseResponse>> getById(@PathVariable UUID id) {
        return warehouseQuery.findById(id)
            .map(warehouse -> ResponseEntity.ok(mapper.toResponse(warehouse)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/code/{code}")
    public Mono<ResponseEntity<WarehouseResponse>> getByCode(@PathVariable String code) {
        return warehouseQuery.findByCode(code)
            .map(warehouse -> ResponseEntity.ok(mapper.toResponse(warehouse)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Mono<ResponseEntity<WarehouseResponse>> create(@Valid @RequestBody CreateWarehouseRequest request) {
        var command = new WarehouseCommandPort.CreateWarehouseCommand(
            request.code(),
            request.name(),
            request.address()
        );
        return warehouseCommand.create(command)
            .map(saved -> ResponseEntity.status(HttpStatus.CREATED)
                .body(mapper.toResponse(saved)));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<WarehouseResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWarehouseRequest request) {
        var command = new WarehouseCommandPort.UpdateWarehouseCommand(
            request.name(),
            request.address()
        );
        
        // Update básico
        Mono<ResponseEntity<WarehouseResponse>> result = warehouseCommand.update(id, command)
            .map(updated -> ResponseEntity.ok(mapper.toResponse(updated)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
        
        // Si hay cambio de estado, encadenar después del update
        if (request.active() != null) {
            final boolean shouldActivate = request.active();
            result = warehouseCommand.update(id, command)
                .flatMap(updated -> shouldActivate 
                    ? warehouseCommand.activate(id) 
                    : warehouseCommand.deactivate(id))
                .map(updated -> ResponseEntity.ok(mapper.toResponse(updated)))
                .defaultIfEmpty(ResponseEntity.notFound().build());
        }
        
        return result;
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> delete(@PathVariable UUID id) {
        return warehouseQuery.findById(id)
            .flatMap(existing -> Mono.just(ResponseEntity.noContent().<Void>build()))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/deactivate")
    public Mono<ResponseEntity<WarehouseResponse>> deactivate(@PathVariable UUID id) {
        return warehouseCommand.deactivate(id)
            .map(deactivated -> ResponseEntity.ok(mapper.toResponse(deactivated)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/activate")
    public Mono<ResponseEntity<WarehouseResponse>> activate(@PathVariable UUID id) {
        return warehouseCommand.activate(id)
            .map(activated -> ResponseEntity.ok(mapper.toResponse(activated)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }
}
