package com.inventory.adapters.web.controller.transfer;

import com.inventory.application.transfer.dto.CreateTransferRequest;
import com.inventory.application.transfer.dto.TransferDto;
import com.inventory.application.transfer.dto.UpdateTransferRequest;
import com.inventory.application.mapper.TransferMapper;
import com.inventory.domain.model.transfer.Transfer;
import com.inventory.domain.ports.in.transfer.TransferCommandPort;
import com.inventory.domain.ports.in.transfer.TransferQueryPort;
import com.inventory.domain.ports.in.warehouse.WarehouseQueryPort;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Controller REST para Transferencias.
 * (hexagonal: adapter que usa ports de entrada)
 */
@RestController
@RequestMapping("/api/v1/transfers")
public class TransferController {

    private final TransferCommandPort commandPort;
    private final TransferQueryPort queryPort;
    private final TransferMapper mapper;
    private final WarehouseQueryPort warehouseQueryPort;

    public TransferController(
            TransferCommandPort commandPort,
            TransferQueryPort queryPort,
            TransferMapper mapper,
            WarehouseQueryPort warehouseQueryPort) {
        this.commandPort = commandPort;
        this.queryPort = queryPort;
        this.mapper = mapper;
        this.warehouseQueryPort = warehouseQueryPort;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('transfers:read')")
    public Flux<TransferDto> getAll() {
        return queryPort.findAll().flatMap(this::enrichWithNames);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('transfers:read')")
    public Mono<TransferDto> getById(@PathVariable UUID id) {
        return queryPort.findById(id).flatMap(this::enrichWithNames);
    }

    @GetMapping("/from-warehouse/{warehouseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('transfers:read')")
    public Flux<TransferDto> getByFromWarehouse(@PathVariable UUID warehouseId) {
        return queryPort.findByFromWarehouse(warehouseId).flatMap(this::enrichWithNames);
    }

    @GetMapping("/to-warehouse/{warehouseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('transfers:read')")
    public Flux<TransferDto> getByToWarehouse(@PathVariable UUID warehouseId) {
        return queryPort.findByToWarehouse(warehouseId).flatMap(this::enrichWithNames);
    }

    @GetMapping("/warehouse/{warehouseId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('transfers:read')")
    public Flux<TransferDto> getByWarehouse(@PathVariable UUID warehouseId) {
        return queryPort.findByWarehouse(warehouseId).flatMap(this::enrichWithNames);
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('transfers:read')")
    public Flux<TransferDto> getByStatus(@PathVariable String status) {
        Transfer.TransferStatus transferStatus = Transfer.TransferStatus.valueOf(status.toUpperCase());
        return queryPort.findByStatus(transferStatus).flatMap(this::enrichWithNames);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('transfers:create')")
    public Mono<TransferDto> create(
            @Valid @RequestBody CreateTransferRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = extractUserId(userDetails);
        TransferCommandPort.CreateTransferCommand command = new TransferCommandPort.CreateTransferCommand(
                request.fromWarehouseId(),
                request.toWarehouseId(),
                request.notes(),
                request.transferDate(),
                request.lines().stream()
                        .map(l -> new TransferCommandPort.CreateTransferCommand.LineItem(l.productId(), l.quantity()))
                        .collect(Collectors.toList()),
                userId
        );
        return commandPort.create(command).flatMap(this::enrichWithNames);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('transfers:update')")
    public Mono<TransferDto> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTransferRequest request) {
        TransferCommandPort.UpdateTransferCommand command = new TransferCommandPort.UpdateTransferCommand(
                request.fromWarehouseId(),
                request.toWarehouseId(),
                request.notes(),
                request.transferDate(),
                request.lines().stream()
                        .map(l -> new TransferCommandPort.CreateTransferCommand.LineItem(l.productId(), l.quantity()))
                        .collect(Collectors.toList())
        );
        return commandPort.update(id, command).flatMap(this::enrichWithNames);
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('transfers:update')")
    public Mono<TransferDto> confirm(@PathVariable UUID id) {
        return commandPort.confirm(id).flatMap(this::enrichWithNames);
    }

    @PostMapping("/{id}/ship")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('transfers:update')")
    public Mono<TransferDto> ship(@PathVariable UUID id) {
        return commandPort.ship(id).flatMap(this::enrichWithNames);
    }

    @PostMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('transfers:update')")
    public Mono<TransferDto> complete(
            @PathVariable UUID id,
            @RequestParam(required = false) LocalDate receivedDate) {
        return commandPort.complete(id, receivedDate).flatMap(this::enrichWithNames);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('transfers:update')")
    public Mono<TransferDto> cancel(@PathVariable UUID id) {
        return commandPort.cancel(id).flatMap(this::enrichWithNames);
    }

    @DeleteMapping("/batch")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('transfers:delete')")
    public Mono<Void> deleteBatch(@RequestBody List<UUID> ids) {
        return commandPort.deleteAll(ids);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('transfers:delete')")
    public Mono<Void> delete(@PathVariable UUID id) {
        return commandPort.delete(id);
    }

    // Helper methods (clean-code: single responsibility)

    private Mono<TransferDto> enrichWithNames(Transfer transfer) {
        return Mono.zip(
                warehouseQueryPort.findById(transfer.getFromWarehouseId())
                        .map(w -> w.getName())
                        .defaultIfEmpty("Unknown"),
                warehouseQueryPort.findById(transfer.getToWarehouseId())
                        .map(w -> w.getName())
                        .defaultIfEmpty("Unknown"))
                .map(tuple -> mapper.toDtoWithNames(transfer, tuple.getT1(), tuple.getT2()));
    }

    private UUID extractUserId(UserDetails userDetails) {
        if (userDetails == null) return null;
        try {
            return UUID.fromString(userDetails.getUsername());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
