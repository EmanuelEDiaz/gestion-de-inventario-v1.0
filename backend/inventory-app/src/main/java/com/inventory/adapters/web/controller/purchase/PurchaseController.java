package com.inventory.adapters.web.controller.purchase;

import com.inventory.application.purchase.dto.CreatePurchaseRequest;
import com.inventory.application.purchase.dto.PurchaseDto;
import com.inventory.application.mapper.PurchaseMapper;
import com.inventory.domain.model.purchase.Purchase;
import com.inventory.domain.ports.in.purchase.PurchaseCommandPort;
import com.inventory.domain.ports.in.purchase.PurchaseQueryPort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/purchases")
public class PurchaseController {

    private final PurchaseQueryPort queryPort;
    private final PurchaseCommandPort commandPort;
    private final PurchaseMapper mapper;

    public PurchaseController(PurchaseQueryPort queryPort, PurchaseCommandPort commandPort, PurchaseMapper mapper) {
        this.queryPort = queryPort;
        this.commandPort = commandPort;
        this.mapper = mapper;
    }

    @GetMapping
    public Flux<PurchaseDto> getAll(
            @RequestParam(required = false) UUID supplierId,
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Purchase.PurchaseStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            statusEnum = Purchase.PurchaseStatus.valueOf(status);
        }
        
        PurchaseQueryPort.PurchaseFilter filter = new PurchaseQueryPort.PurchaseFilter(
                supplierId, warehouseId, statusEnum, fromDate, toDate, page, size
        );
        
        return queryPort.findAll(filter).map(mapper::toDto);
    }

    @GetMapping("/{id}")
    public Mono<PurchaseDto> getById(@PathVariable UUID id) {
        return queryPort.findById(id).map(mapper::toDto);
    }

    @GetMapping("/number/{purchaseNumber}")
    public Mono<PurchaseDto> getByNumber(@PathVariable String purchaseNumber) {
        return queryPort.findByNumber(purchaseNumber).map(mapper::toDto);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<PurchaseDto> create(
            @RequestBody CreatePurchaseRequest request,
            @AuthenticationPrincipal UserDetails user) {
        
        var command = new PurchaseCommandPort.CreatePurchaseCommand(
                request.warehouseId(),
                request.supplierId(),
                request.currencyCode(),
                request.notes(),
                request.purchaseDate(),
                request.lines().stream()
                        .map(l -> new PurchaseCommandPort.CreatePurchaseCommand.LineItem(
                                l.productId(), l.quantity(), l.unitCost()))
                        .collect(Collectors.toList()),
                null // TODO: get user ID from authentication
        );
        
        return commandPort.create(command).map(mapper::toDto);
    }

    @PostMapping("/{id}/confirm")
    public Mono<PurchaseDto> confirm(@PathVariable UUID id) {
        return commandPort.confirm(id).map(mapper::toDto);
    }

    @PostMapping("/{id}/receive")
    public Mono<PurchaseDto> receive(
            @PathVariable UUID id,
            @RequestParam(required = false) LocalDate receivedDate) {
        return commandPort.receive(id, receivedDate).map(mapper::toDto);
    }

    @PostMapping("/{id}/cancel")
    public Mono<PurchaseDto> cancel(@PathVariable UUID id) {
        return commandPort.cancel(id).map(mapper::toDto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(@PathVariable UUID id) {
        return commandPort.delete(id);
    }
}
