package com.inventory.adapters.web.controller;

import com.inventory.adapters.web.dto.CreateCurrencyRequest;
import com.inventory.adapters.web.dto.CurrencyResponse;
import com.inventory.adapters.web.dto.UpdateCurrencyRequest;
import com.inventory.domain.model.Currency;
import com.inventory.domain.ports.in.CurrencyCommandPort;
import com.inventory.domain.ports.in.CurrencyQueryPort;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/v1/currencies")
public class CurrencyController {

    private final CurrencyQueryPort currencyQuery;
    private final CurrencyCommandPort currencyCommand;

    public CurrencyController(CurrencyQueryPort currencyQuery, CurrencyCommandPort currencyCommand) {
        this.currencyQuery = currencyQuery;
        this.currencyCommand = currencyCommand;
    }

    @GetMapping
    public Flux<CurrencyResponse> getAll() {
        return currencyQuery.findAll().map(this::toResponse);
    }

    @GetMapping("/{code}")
    public Mono<ResponseEntity<CurrencyResponse>> getByCode(@PathVariable String code) {
        return currencyQuery.findByCode(code)
            .map(c -> ResponseEntity.ok(toResponse(c)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Mono<ResponseEntity<CurrencyResponse>> create(@Valid @RequestBody CreateCurrencyRequest request) {
        var command = new CurrencyCommandPort.CreateCurrencyCommand(
            request.code(), request.name(), request.symbol()
        );
        return currencyCommand.create(command)
            .map(saved -> ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved)));
    }

    @PatchMapping("/{code}")
    @PreAuthorize("hasRole('ADMIN')")
    public Mono<ResponseEntity<CurrencyResponse>> update(
            @PathVariable String code,
            @Valid @RequestBody UpdateCurrencyRequest request) {
        var command = new CurrencyCommandPort.UpdateCurrencyCommand(
            request.name(), request.symbol(), request.isActive()
        );
        return currencyCommand.update(code, command)
            .map(updated -> ResponseEntity.ok(toResponse(updated)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    private CurrencyResponse toResponse(Currency c) {
        return new CurrencyResponse(c.getCode(), c.getName(), c.getSymbol(), c.isActive());
    }
}
