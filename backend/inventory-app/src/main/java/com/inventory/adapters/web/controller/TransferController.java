package com.inventory.adapters.web.controller;

import com.inventory.application.dto.CreateTransferRequest;
import com.inventory.application.dto.TransferDto;
import com.inventory.application.dto.UpdateTransferRequest;
import com.inventory.application.mapper.TransferMapper;
import com.inventory.domain.model.Transfer;
import com.inventory.domain.ports.in.TransferCommandPort;
import com.inventory.domain.ports.in.TransferQueryPort;
import com.inventory.domain.ports.in.WarehouseQueryPort;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
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
    public Flux<TransferDto> getAll() {
        return queryPort.findAll().flatMap(this::enrichWithNames);
    }

    @GetMapping("/{id}")
    public Mono<TransferDto> getById(@PathVariable UUID id) {
        return queryPort.findById(id).flatMap(this::enrichWithNames);
    }

    @GetMapping("/from-warehouse/{warehouseId}")
    public Flux<TransferDto> getByFromWarehouse(@PathVariable UUID warehouseId) {
        return queryPort.findByFromWarehouse(warehouseId).flatMap(this::enrichWithNames);
    }

    @GetMapping("/to-warehouse/{warehouseId}")
    public Flux<TransferDto> getByToWarehouse(@PathVariable UUID warehouseId) {
        return queryPort.findByToWarehouse(warehouseId).flatMap(this::enrichWithNames);
    }

    @GetMapping("/warehouse/{warehouseId}")
    public Flux<TransferDto> getByWarehouse(@PathVariable UUID warehouseId) {
        return queryPort.findByWarehouse(warehouseId).flatMap(this::enrichWithNames);
    }

    @GetMapping("/status/{status}")
    public Flux<TransferDto> getByStatus(@PathVariable String status) {
        Transfer.TransferStatus transferStatus = Transfer.TransferStatus.valueOf(status.toUpperCase());
        return queryPort.findByStatus(transferStatus).flatMap(this::enrichWithNames);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
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
    public Mono<TransferDto> confirm(@PathVariable UUID id) {
        return commandPort.confirm(id).flatMap(this::enrichWithNames);
    }

    @PostMapping("/{id}/ship")
    public Mono<TransferDto> ship(@PathVariable UUID id) {
        return commandPort.ship(id).flatMap(this::enrichWithNames);
    }

    @PostMapping("/{id}/complete")
    public Mono<TransferDto> complete(
            @PathVariable UUID id,
            @RequestParam(required = false) LocalDate receivedDate) {
        return commandPort.complete(id, receivedDate).flatMap(this::enrichWithNames);
    }

    @PostMapping("/{id}/cancel")
    public Mono<TransferDto> cancel(@PathVariable UUID id) {
        return commandPort.cancel(id).flatMap(this::enrichWithNames);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
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
