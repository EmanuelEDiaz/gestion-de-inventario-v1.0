package com.inventory.adapters.web.controller;

import com.inventory.application.dto.AdjustmentDto;
import com.inventory.application.dto.CreateAdjustmentRequest;
import com.inventory.application.dto.UpdateAdjustmentRequest;
import com.inventory.application.mapper.AdjustmentMapper;
import com.inventory.domain.model.adjustment.Adjustment;
import com.inventory.domain.ports.in.AdjustmentCommandPort;
import com.inventory.domain.ports.in.AdjustmentQueryPort;
import com.inventory.domain.ports.in.WarehouseQueryPort;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Controller REST para ajustes de inventario.
 * Delega en puertos de entrada (command/query).
 */
@RestController
@RequestMapping("/api/v1/adjustments")
public class AdjustmentController {

    private final AdjustmentCommandPort commandPort;
    private final AdjustmentQueryPort queryPort;
    private final WarehouseQueryPort warehouseQueryPort;
    private final AdjustmentMapper mapper;

    public AdjustmentController(AdjustmentCommandPort commandPort, AdjustmentQueryPort queryPort,
                                 WarehouseQueryPort warehouseQueryPort, AdjustmentMapper mapper) {
        this.commandPort = commandPort;
        this.queryPort = queryPort;
        this.warehouseQueryPort = warehouseQueryPort;
        this.mapper = mapper;
    }

    @GetMapping
    public Flux<AdjustmentDto> findAll() {
        return queryPort.findAll().flatMap(this::enrichWithWarehouse);
    }

    @GetMapping("/{id}")
    public Mono<AdjustmentDto> findById(@PathVariable UUID id) {
        return queryPort.findById(id).flatMap(this::enrichWithWarehouse);
    }

    @GetMapping("/warehouse/{warehouseId}")
    public Flux<AdjustmentDto> findByWarehouse(@PathVariable UUID warehouseId) {
        return queryPort.findByWarehouse(warehouseId).flatMap(this::enrichWithWarehouse);
    }

    @GetMapping("/status/{status}")
    public Flux<AdjustmentDto> findByStatus(@PathVariable String status) {
        var adjustmentStatus = Adjustment.AdjustmentStatus.valueOf(status.toUpperCase());
        return queryPort.findByStatus(adjustmentStatus).flatMap(this::enrichWithWarehouse);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<AdjustmentDto> create(@Valid @RequestBody CreateAdjustmentRequest request,
                                       @AuthenticationPrincipal UserDetails user) {
        var command = buildCreateCommand(request, user);
        return commandPort.create(command).flatMap(this::enrichWithWarehouse);
    }

    @PutMapping("/{id}")
    public Mono<AdjustmentDto> update(@PathVariable UUID id,
                                       @Valid @RequestBody UpdateAdjustmentRequest request) {
        var command = buildUpdateCommand(id, request);
        return commandPort.update(command).flatMap(this::enrichWithWarehouse);
    }

    @PostMapping("/{id}/confirm")
    public Mono<AdjustmentDto> confirm(@PathVariable UUID id) {
        return commandPort.confirm(id).flatMap(this::enrichWithWarehouse);
    }

    @PostMapping("/{id}/cancel")
    public Mono<AdjustmentDto> cancel(@PathVariable UUID id) {
        return commandPort.cancel(id).flatMap(this::enrichWithWarehouse);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(@PathVariable UUID id) {
        return commandPort.delete(id);
    }

    private AdjustmentCommandPort.CreateAdjustmentCommand buildCreateCommand(
            CreateAdjustmentRequest request, UserDetails user) {
        var lines = request.lines().stream()
                .map(l -> new AdjustmentCommandPort.LineCommand(
                        l.productId(), l.systemQty(), l.countedQty(), l.unitCost()))
                .toList();
        return new AdjustmentCommandPort.CreateAdjustmentCommand(
                request.warehouseId(),
                Adjustment.AdjustmentType.valueOf(request.type().toUpperCase()),
                request.reason(),
                request.notes(),
                extractUserId(user),
                lines
        );
    }

    private AdjustmentCommandPort.UpdateAdjustmentCommand buildUpdateCommand(
            UUID id, UpdateAdjustmentRequest request) {
        var lines = request.lines().stream()
                .map(l -> new AdjustmentCommandPort.LineCommand(
                        l.productId(), l.systemQty(), l.countedQty(), l.unitCost()))
                .toList();
        return new AdjustmentCommandPort.UpdateAdjustmentCommand(
                id, Adjustment.AdjustmentType.valueOf(request.type().toUpperCase()),
                request.reason(), request.notes(), lines
        );
    }

    private UUID extractUserId(UserDetails user) {
        if (user == null) return null;
        try {
            return UUID.fromString(user.getUsername());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private Mono<AdjustmentDto> enrichWithWarehouse(Adjustment adjustment) {
        return warehouseQueryPort.findById(adjustment.getWarehouseId())
                .map(warehouse -> {
                    var dto = mapper.toDto(adjustment);
                    return new AdjustmentDto(
                            dto.id(), dto.adjustmentNumber(), dto.warehouseId(),
                            warehouse.getName(), dto.type(), dto.status(),
                            dto.reason(), dto.notes(), dto.adjustmentDate(),
                            dto.createdBy(), dto.createdAt(), dto.lines()
                    );
                })
                .defaultIfEmpty(mapper.toDto(adjustment));
    }
}
