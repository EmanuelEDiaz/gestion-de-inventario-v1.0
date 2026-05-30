package com.inventory.adapters.web.controller.returns;

import com.inventory.application.returns.dto.CreateReturnRequest;
import com.inventory.application.returns.dto.ReturnDto;
import com.inventory.application.returns.dto.UpdateReturnRequest;
import com.inventory.application.mapper.ReturnMapper;
import com.inventory.domain.model.returns.Return;
import com.inventory.domain.ports.in.returns.ReturnCommandPort;
import com.inventory.domain.ports.in.returns.ReturnQueryPort;
import com.inventory.domain.ports.in.warehouse.WarehouseQueryPort;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
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
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('returns:read')")
    public Flux<ReturnDto> findAll() {
        return queryPort.findAll().flatMap(this::enrichWithWarehouse);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('returns:read')")
    public Mono<ReturnDto> findById(@PathVariable UUID id) {
        return queryPort.findById(id).flatMap(this::enrichWithWarehouse);
    }

    @GetMapping("/warehouse/{warehouseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('returns:read')")
    public Flux<ReturnDto> findByWarehouse(@PathVariable UUID warehouseId) {
        return queryPort.findByWarehouse(warehouseId).flatMap(this::enrichWithWarehouse);
    }

    @GetMapping("/type/{type}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('returns:read')")
    public Flux<ReturnDto> findByType(@PathVariable String type) {
        var returnType = Return.ReturnType.valueOf(type.toUpperCase());
        return queryPort.findByType(returnType).flatMap(this::enrichWithWarehouse);
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('returns:read')")
    public Flux<ReturnDto> findByStatus(@PathVariable String status) {
        var returnStatus = Return.ReturnStatus.valueOf(status.toUpperCase());
        return queryPort.findByStatus(returnStatus).flatMap(this::enrichWithWarehouse);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('returns:create')")
    public Mono<ReturnDto> create(@Valid @RequestBody CreateReturnRequest request,
                                   @AuthenticationPrincipal UserDetails user) {
        var command = buildCreateCommand(request, user);
        return commandPort.create(command).flatMap(this::enrichWithWarehouse);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('returns:update')")
    public Mono<ReturnDto> update(@PathVariable UUID id,
                                   @Valid @RequestBody UpdateReturnRequest request) {
        var command = buildUpdateCommand(id, request);
        return commandPort.update(command).flatMap(this::enrichWithWarehouse);
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('returns:update')")
    public Mono<ReturnDto> confirm(@PathVariable UUID id) {
        return commandPort.confirm(id).flatMap(this::enrichWithWarehouse);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('returns:update')")
    public Mono<ReturnDto> cancel(@PathVariable UUID id) {
        return commandPort.cancel(id).flatMap(this::enrichWithWarehouse);
    }

    @DeleteMapping("/batch")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('returns:delete')")
    public Mono<Void> deleteBatch(@RequestBody List<UUID> ids) {
        return commandPort.deleteAll(ids);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('returns:delete')")
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
