package com.inventory.adapters.web.controller;

import com.inventory.application.dto.CreateReturnRequest;
import com.inventory.application.dto.ReturnDto;
import com.inventory.application.dto.UpdateReturnRequest;
import com.inventory.application.mapper.ReturnMapper;
import com.inventory.domain.model.Return;
import com.inventory.domain.ports.in.ReturnCommandPort;
import com.inventory.domain.ports.in.ReturnQueryPort;
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
 * Controller REST para devoluciones.
 */
@RestController
@RequestMapping("/api/v1/returns")
public class ReturnController {

    private final ReturnCommandPort commandPort;
    private final ReturnQueryPort queryPort;
    private final WarehouseQueryPort warehouseQueryPort;
    private final ReturnMapper mapper;

    public ReturnController(ReturnCommandPort commandPort, ReturnQueryPort queryPort,
                             WarehouseQueryPort warehouseQueryPort, ReturnMapper mapper) {
        this.commandPort = commandPort;
        this.queryPort = queryPort;
        this.warehouseQueryPort = warehouseQueryPort;
        this.mapper = mapper;
    }

    @GetMapping
    public Flux<ReturnDto> findAll() {
        return queryPort.findAll().flatMap(this::enrichWithWarehouse);
    }

    @GetMapping("/{id}")
    public Mono<ReturnDto> findById(@PathVariable UUID id) {
        return queryPort.findById(id).flatMap(this::enrichWithWarehouse);
    }

    @GetMapping("/warehouse/{warehouseId}")
    public Flux<ReturnDto> findByWarehouse(@PathVariable UUID warehouseId) {
        return queryPort.findByWarehouse(warehouseId).flatMap(this::enrichWithWarehouse);
    }

    @GetMapping("/type/{type}")
    public Flux<ReturnDto> findByType(@PathVariable String type) {
        var returnType = Return.ReturnType.valueOf(type.toUpperCase());
        return queryPort.findByType(returnType).flatMap(this::enrichWithWarehouse);
    }

    @GetMapping("/status/{status}")
    public Flux<ReturnDto> findByStatus(@PathVariable String status) {
        var returnStatus = Return.ReturnStatus.valueOf(status.toUpperCase());
        return queryPort.findByStatus(returnStatus).flatMap(this::enrichWithWarehouse);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<ReturnDto> create(@Valid @RequestBody CreateReturnRequest request,
                                   @AuthenticationPrincipal UserDetails user) {
        var command = buildCreateCommand(request, user);
        return commandPort.create(command).flatMap(this::enrichWithWarehouse);
    }

    @PutMapping("/{id}")
    public Mono<ReturnDto> update(@PathVariable UUID id,
                                   @Valid @RequestBody UpdateReturnRequest request) {
        var command = buildUpdateCommand(id, request);
        return commandPort.update(command).flatMap(this::enrichWithWarehouse);
    }

    @PostMapping("/{id}/confirm")
    public Mono<ReturnDto> confirm(@PathVariable UUID id) {
        return commandPort.confirm(id).flatMap(this::enrichWithWarehouse);
    }

    @PostMapping("/{id}/cancel")
    public Mono<ReturnDto> cancel(@PathVariable UUID id) {
        return commandPort.cancel(id).flatMap(this::enrichWithWarehouse);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(@PathVariable UUID id) {
        return commandPort.delete(id);
    }

    private ReturnCommandPort.CreateReturnCommand buildCreateCommand(
            CreateReturnRequest request, UserDetails user) {
        var lines = request.lines().stream()
                .map(l -> new ReturnCommandPort.LineCommand(
                        l.productId(), l.quantity(), l.unitPrice(), l.unitCost()))
                .toList();
        return new ReturnCommandPort.CreateReturnCommand(
                Return.ReturnType.valueOf(request.type().toUpperCase()),
                request.warehouseId(),
                request.originalDocumentId(),
                request.reason(),
                request.notes(),
                extractUserId(user),
                lines
        );
    }

    private ReturnCommandPort.UpdateReturnCommand buildUpdateCommand(UUID id, UpdateReturnRequest request) {
        var lines = request.lines().stream()
                .map(l -> new ReturnCommandPort.LineCommand(
                        l.productId(), l.quantity(), l.unitPrice(), l.unitCost()))
                .toList();
        return new ReturnCommandPort.UpdateReturnCommand(id, request.reason(), request.notes(), lines);
    }

    private UUID extractUserId(UserDetails user) {
        if (user == null) return null;
        try {
            return UUID.fromString(user.getUsername());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private Mono<ReturnDto> enrichWithWarehouse(Return returnEntity) {
        return warehouseQueryPort.findById(returnEntity.getWarehouseId())
                .map(warehouse -> {
                    var dto = mapper.toDto(returnEntity);
                    return new ReturnDto(
                            dto.id(), dto.returnNumber(), dto.type(), dto.warehouseId(),
                            warehouse.getName(), dto.originalDocumentId(), dto.status(),
                            dto.reason(), dto.notes(), dto.returnDate(), dto.totalAmount(),
                            dto.createdBy(), dto.createdAt(), dto.lines()
                    );
                })
                .defaultIfEmpty(mapper.toDto(returnEntity));
    }
}
