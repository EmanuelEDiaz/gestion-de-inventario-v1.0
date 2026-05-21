package com.inventory.adapters.web.controller;

import com.inventory.adapters.web.dto.AppSettingsResponse;
import com.inventory.adapters.web.dto.AppSettingsUpdateRequest;
import com.inventory.adapters.web.mapper.AppSettingsWebMapper;
import com.inventory.application.usecase.command.UpdateSettingsUseCase;
import com.inventory.application.usecase.query.SettingsQueryUseCase;
import com.inventory.domain.model.settings.AppSettings.CostMethod;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Controlador REST para la configuración global del sistema.
 *
 * GET  /api/v1/settings   → retorna ETag con versión actual
 * PATCH /api/v1/settings  → requiere If-Match con versión actual (optimistic lock)
 */
@RestController
@RequestMapping("/api/v1/settings")
public class SettingsController {

    private final SettingsQueryUseCase queryUseCase;
    private final UpdateSettingsUseCase updateUseCase;
    private final AppSettingsWebMapper mapper;

    public SettingsController(SettingsQueryUseCase queryUseCase,
                               UpdateSettingsUseCase updateUseCase,
                               AppSettingsWebMapper mapper) {
        this.queryUseCase = queryUseCase;
        this.updateUseCase = updateUseCase;
        this.mapper = mapper;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Mono<ResponseEntity<AppSettingsResponse>> getSettings() {
        return queryUseCase.execute()
                .map(settings -> ResponseEntity.ok()
                        .eTag("W/\"" + settings.getVersion() + "\"")
                        .body(mapper.toResponse(settings)));
    }

    @PatchMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Mono<ResponseEntity<AppSettingsResponse>> updateSettings(
            @Valid @RequestBody AppSettingsUpdateRequest request,
            @RequestHeader(value = "If-Match", required = false) String ifMatch,
            @AuthenticationPrincipal UserDetails userDetails) {

        Integer clientVersion = parseIfMatch(ifMatch);
        UUID actorId = resolveActorId(userDetails);

        CostMethod costMethod = request.defaultCostMethod() != null
                ? CostMethod.valueOf(request.defaultCostMethod())
                : null;

        UpdateSettingsUseCase.Command command = new UpdateSettingsUseCase.Command(
                clientVersion,
                costMethod,
                request.defaultCurrencyCode(),
                request.companyName(),
                request.lowStockThresholdDefault(),
                actorId
        );

        return updateUseCase.execute(command)
                .map(updated -> ResponseEntity.ok()
                        .eTag("W/\"" + updated.getVersion() + "\"")
                        .body(mapper.toResponse(updated)));
    }

    /**
     * Parsea el valor del header If-Match: W/"version" → versión entera.
     * Retorna null si el header no está presente.
     */
    private Integer parseIfMatch(String ifMatch) {
        if (ifMatch == null || ifMatch.isBlank()) return null;
        try {
            String cleaned = ifMatch.trim().replaceAll("W/\"?", "").replaceAll("\"", "");
            return Integer.parseInt(cleaned);
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Header If-Match inválido. Formato esperado: W/\"<version>\" (ejemplo: W/\"3\")");
        }
    }

    private UUID resolveActorId(UserDetails userDetails) {
        if (userDetails == null) return null;
        try {
            return UUID.fromString(userDetails.getUsername());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}