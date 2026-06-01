package com.inventory.adapters.web.controller.currency;

import com.inventory.adapters.web.dto.currency.CreateCurrencyRequest;
import com.inventory.adapters.web.dto.currency.CurrencyResponse;
import com.inventory.adapters.web.dto.currency.UpdateCurrencyRequest;
import com.inventory.domain.model.currency.Currency;
import com.inventory.domain.ports.in.currency.CurrencyCommandPort;
import com.inventory.domain.ports.in.currency.CurrencyQueryPort;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

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
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('currencies:read')")
    public Flux<CurrencyResponse> getAll() {
        return currencyQuery.findAll().map(this::toResponse);
    }

    @GetMapping("/{code}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('currencies:read')")
    public Mono<ResponseEntity<CurrencyResponse>> getByCode(@PathVariable String code) {
        return currencyQuery.findByCode(code)
            .map(c -> ResponseEntity.ok(toResponse(c)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('currencies:create')")
    public Mono<ResponseEntity<CurrencyResponse>> create(
            @Valid @RequestBody CreateCurrencyRequest request,
            @AuthenticationPrincipal UserDetails user) {
        var command = new CurrencyCommandPort.CreateCurrencyCommand(
            request.code(), request.name(), request.symbol()
        );
        return currencyCommand.create(command, extractUserId(user))
            .map(saved -> ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved)));
    }

    @PatchMapping("/{code}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('currencies:update')")
    public Mono<ResponseEntity<CurrencyResponse>> update(
            @PathVariable String code,
            @Valid @RequestBody UpdateCurrencyRequest request,
            @AuthenticationPrincipal UserDetails user) {
        var command = new CurrencyCommandPort.UpdateCurrencyCommand(
            request.name(), request.symbol(), request.isActive()
        );
        return currencyCommand.update(code, command, extractUserId(user))
            .map(updated -> ResponseEntity.ok(toResponse(updated)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{code}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('currencies:delete')")
    public Mono<ResponseEntity<Void>> delete(
            @PathVariable String code,
            @AuthenticationPrincipal UserDetails user) {
        return currencyCommand.delete(code, extractUserId(user))
            .then(Mono.just(ResponseEntity.noContent().build()));
    }

    private CurrencyResponse toResponse(Currency c) {
        return new CurrencyResponse(c.getCode(), c.getName(), c.getSymbol(), c.isActive());
    }

    private UUID extractUserId(UserDetails user) {
        if (user == null) return null;
        try {
            return UUID.fromString(user.getUsername());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
