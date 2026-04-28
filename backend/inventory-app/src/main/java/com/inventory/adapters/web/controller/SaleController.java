package com.inventory.adapters.web.controller;

import com.inventory.application.dto.CreateSaleRequest;
import com.inventory.application.dto.SaleDto;
import com.inventory.application.mapper.SaleMapper;
import com.inventory.domain.model.Sale;
import com.inventory.domain.ports.in.SaleCommandPort;
import com.inventory.domain.ports.in.SaleQueryPort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sales")
public class SaleController {

    private final SaleQueryPort saleQueryPort;
    private final SaleCommandPort saleCommandPort;
    private final SaleMapper saleMapper;

    public SaleController(
        SaleQueryPort saleQueryPort,
        SaleCommandPort saleCommandPort,
        SaleMapper saleMapper
    ) {
        this.saleQueryPort = saleQueryPort;
        this.saleCommandPort = saleCommandPort;
        this.saleMapper = saleMapper;
    }

    @GetMapping
    public Flux<SaleDto> getAll(
        @RequestParam(required = false) UUID warehouseId,
        @RequestParam(required = false) UUID customerId,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) LocalDate fromDate,
        @RequestParam(required = false) LocalDate toDate
    ) {
        Flux<Sale> sales;
        
        if (warehouseId != null) {
            sales = saleQueryPort.findByWarehouse(warehouseId);
        } else if (customerId != null) {
            sales = saleQueryPort.findByCustomer(customerId);
        } else if (status != null) {
            sales = saleQueryPort.findByStatus(Sale.SaleStatus.valueOf(status));
        } else if (fromDate != null && toDate != null) {
            sales = saleQueryPort.findByDateRange(fromDate, toDate);
        } else {
            sales = saleQueryPort.findAll();
        }
        
        return sales.map(saleMapper::toDto);
    }

    @GetMapping("/{id}")
    public Mono<SaleDto> getById(@PathVariable UUID id) {
        return saleQueryPort.findById(id)
            .map(saleMapper::toDto);
    }

    @GetMapping("/number/{saleNumber}")
    public Mono<SaleDto> getByNumber(@PathVariable String saleNumber) {
        return saleQueryPort.findByNumber(saleNumber)
            .map(saleMapper::toDto);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<SaleDto> create(
        @RequestBody CreateSaleRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = extractUserId(userDetails);
        SaleCommandPort.CreateCommand cmd = new SaleCommandPort.CreateCommand(
            request.warehouseId(),
            request.customerId(),
            request.currencyCode(),
            request.notes(),
            request.saleDate(),
            request.lines() == null ? List.of() :
                request.lines().stream()
                    .map(l -> new SaleCommandPort.CreateCommand.SaleLineCommand(
                        l.productId(), l.quantity(), l.unitPrice(), l.discount()))
                    .toList(),
            null
        );
        return saleCommandPort.create(cmd, userId)
            .map(saleMapper::toDto);
    }

    @PostMapping("/{id}/confirm")
    public Mono<SaleDto> confirm(@PathVariable UUID id) {
        return saleCommandPort.confirm(id)
            .map(saleMapper::toDto);
    }

    @PostMapping("/{id}/deliver")
    public Mono<SaleDto> deliver(@PathVariable UUID id) {
        return saleCommandPort.deliver(id)
            .map(saleMapper::toDto);
    }

    @PostMapping("/{id}/cancel")
    public Mono<SaleDto> cancel(@PathVariable UUID id) {
        return saleCommandPort.cancel(id)
            .map(saleMapper::toDto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(@PathVariable UUID id) {
        return saleCommandPort.delete(id);
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
