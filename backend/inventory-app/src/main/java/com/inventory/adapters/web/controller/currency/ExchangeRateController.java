package com.inventory.adapters.web.controller.currency;

import com.inventory.adapters.web.dto.currency.CreateExchangeRateRequest;
import com.inventory.adapters.web.dto.currency.ExchangeRateResponse;
import com.inventory.adapters.web.dto.currency.UpdateExchangeRateRequest;
import com.inventory.domain.model.currency.ExchangeRate;
import com.inventory.domain.ports.in.currency.ExchangeRateCommandPort;
import com.inventory.domain.ports.in.currency.ExchangeRateQueryPort;
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
@RequestMapping("/api/v1/exchange-rates")
public class ExchangeRateController {

    private final ExchangeRateQueryPort exchangeRateQuery;
    private final ExchangeRateCommandPort exchangeRateCommand;

    public ExchangeRateController(ExchangeRateQueryPort exchangeRateQuery,
                                   ExchangeRateCommandPort exchangeRateCommand) {
        this.exchangeRateQuery   = exchangeRateQuery;
        this.exchangeRateCommand = exchangeRateCommand;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('exchange_rates:read')")
    public Flux<ExchangeRateResponse> getAll(
            @RequestParam(required = false) String baseCode,
            @RequestParam(required = false) String quoteCode,
            @RequestParam(required = false) String rateType) {
        return exchangeRateQuery.findAll(baseCode, quoteCode, rateType).map(this::toResponse);
    }

    @GetMapping("/latest")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('exchange_rates:read')")
    public Mono<ResponseEntity<ExchangeRateResponse>> getLatest(
            @RequestParam String baseCode,
            @RequestParam String quoteCode) {
        return exchangeRateQuery.findLatest(baseCode, quoteCode)
            .map(r -> ResponseEntity.ok(toResponse(r)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') || hasAuthority('exchange_rates:create')")
    public Mono<ResponseEntity<ExchangeRateResponse>> create(
            @Valid @RequestBody CreateExchangeRateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        // createdBy will be resolved from security context in a real implementation
        var command = new ExchangeRateCommandPort.CreateExchangeRateCommand(
            request.baseCode(), request.quoteCode(), request.rate(),
            request.rateType(), request.validFrom(), null
        );
        return exchangeRateCommand.create(command)
            .map(saved -> ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') || hasAuthority('exchange_rates:manage')")
    public Mono<ResponseEntity<ExchangeRateResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateExchangeRateRequest request) {
        var command = new ExchangeRateCommandPort.UpdateExchangeRateCommand(
            request.rate(), request.rateType(), request.validFrom()
        );
        return exchangeRateCommand.update(id, command)
            .map(r -> ResponseEntity.ok(toResponse(r)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('exchange_rates:manage')")
    public Mono<ResponseEntity<Void>> delete(@PathVariable UUID id) {
        return exchangeRateCommand.delete(id)
            .then(Mono.just(ResponseEntity.noContent().build()));
    }

    private ExchangeRateResponse toResponse(ExchangeRate r) {
        return new ExchangeRateResponse(
            r.getId(), r.getBaseCode(), r.getQuoteCode(), r.getRate(),
            r.getRateType().name(), r.getValidFrom(), r.getCreatedBy(), r.getCreatedAt()
        );
    }
}
