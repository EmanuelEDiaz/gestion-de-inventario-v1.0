package com.inventory.adapters.web.controller.warehouse;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.adapters.web.dto.warehouse.*;
import com.inventory.adapters.web.mapper.CatalogWebMapper;
import com.inventory.adapters.web.util.ChecksumUtils;
import com.inventory.domain.ports.in.warehouse.WarehouseCommandPort;
import com.inventory.domain.ports.in.warehouse.WarehouseQueryPort;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final ObjectMapper objectMapper;

    public WarehouseController(
            WarehouseQueryPort warehouseQuery,
            WarehouseCommandPort warehouseCommand,
            CatalogWebMapper mapper,
            ObjectMapper objectMapper) {
        this.warehouseQuery = warehouseQuery;
        this.warehouseCommand = warehouseCommand;
        this.mapper = mapper;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('warehouses:read')")
    public Mono<ResponseEntity<Flux<WarehouseResponse>>> getAll(@RequestParam(defaultValue = "false") boolean activeOnly) {
        Flux<WarehouseResponse> flux = warehouseQuery.findAll(activeOnly)
            .map(mapper::toResponse);
        return ChecksumUtils.withChecksum(flux, objectMapper);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('warehouses:read')")
    public Mono<ResponseEntity<WarehouseResponse>> getById(@PathVariable UUID id) {
        return warehouseQuery.findById(id)
            .map(warehouse -> ResponseEntity.ok(mapper.toResponse(warehouse)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('warehouses:read')")
    public Mono<ResponseEntity<WarehouseResponse>> getByCode(@PathVariable String code) {
        return warehouseQuery.findByCode(code)
            .map(warehouse -> ResponseEntity.ok(mapper.toResponse(warehouse)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('warehouses:create')")
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
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('warehouses:update')")
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
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('warehouses:delete')")
    public Mono<ResponseEntity<Void>> delete(@PathVariable UUID id) {
        return warehouseQuery.findById(id)
            .flatMap(existing -> Mono.just(ResponseEntity.noContent().<Void>build()))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('warehouses:update')")
    public Mono<ResponseEntity<WarehouseResponse>> deactivate(@PathVariable UUID id) {
        return warehouseCommand.deactivate(id)
            .map(deactivated -> ResponseEntity.ok(mapper.toResponse(deactivated)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('warehouses:update')")
    public Mono<ResponseEntity<WarehouseResponse>> activate(@PathVariable UUID id) {
        return warehouseCommand.activate(id)
            .map(activated -> ResponseEntity.ok(mapper.toResponse(activated)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }
}
