package com.inventory.adapters.web.controller;

import com.inventory.adapters.web.dto.CreateExchangeRateRequest;
import com.inventory.adapters.web.dto.ExchangeRateResponse;
import com.inventory.domain.model.ExchangeRate;
import com.inventory.domain.ports.in.ExchangeRateCommandPort;
import com.inventory.domain.ports.in.ExchangeRateQueryPort;
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
    public Flux<ExchangeRateResponse> getAll(
            @RequestParam(required = false) String baseCode,
            @RequestParam(required = false) String quoteCode,
            @RequestParam(required = false) String rateType) {
        return exchangeRateQuery.findAll(baseCode, quoteCode, rateType).map(this::toResponse);
    }

    @GetMapping("/latest")
    public Mono<ResponseEntity<ExchangeRateResponse>> getLatest(
            @RequestParam String baseCode,
            @RequestParam String quoteCode) {
        return exchangeRateQuery.findLatest(baseCode, quoteCode)
            .map(r -> ResponseEntity.ok(toResponse(r)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
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

    private ExchangeRateResponse toResponse(ExchangeRate r) {
        return new ExchangeRateResponse(
            r.getId(), r.getBaseCode(), r.getQuoteCode(), r.getRate(),
            r.getRateType().name(), r.getValidFrom(), r.getCreatedBy(), r.getCreatedAt()
        );
    }
}
