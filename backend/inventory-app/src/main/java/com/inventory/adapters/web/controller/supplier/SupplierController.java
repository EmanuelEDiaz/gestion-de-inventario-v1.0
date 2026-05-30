package com.inventory.adapters.web.controller.supplier;

import com.inventory.application.supplier.dto.CreateSupplierRequest;
import com.inventory.application.supplier.dto.SupplierDto;
import com.inventory.application.supplier.dto.UpdateSupplierRequest;
import com.inventory.application.mapper.SupplierMapper;
import com.inventory.domain.ports.in.supplier.SupplierCommandPort;
import com.inventory.domain.ports.in.supplier.SupplierQueryPort;
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
 * REST Controller para gestión de proveedores.
 */
@RestController
@RequestMapping("/api/v1/suppliers")
public class SupplierController {

    private final SupplierCommandPort commandPort;
    private final SupplierQueryPort queryPort;
    private final SupplierMapper mapper;

    public SupplierController(SupplierCommandPort commandPort,
                              SupplierQueryPort queryPort,
                              SupplierMapper mapper) {
        this.commandPort = commandPort;
        this.queryPort = queryPort;
        this.mapper = mapper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('suppliers:read')")
    public Flux<SupplierDto> findAll(@RequestParam(required = false) Boolean active) {
        if (active != null) {
            return queryPort.findByActive(active).map(mapper::toDto);
        }
        return queryPort.findAll().map(mapper::toDto);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('suppliers:read')")
    public Mono<SupplierDto> findById(@PathVariable UUID id) {
        return queryPort.findById(id).map(mapper::toDto);
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('suppliers:read')")
    public Mono<SupplierDto> findByCode(@PathVariable String code) {
        return queryPort.findByCode(code).map(mapper::toDto);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('suppliers:read')")
    public Flux<SupplierDto> search(@RequestParam String q) {
        return queryPort.search(q).map(mapper::toDto);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('suppliers:create')")
    public Mono<SupplierDto> create(@Valid @RequestBody CreateSupplierRequest request,
                                    @AuthenticationPrincipal UserDetails user) {
        return commandPort.create(new SupplierCommandPort.CreateCommand(
            request.code(),
            request.name(),
            request.contactName(),
            request.phone(),
            request.email(),
            request.address(),
            request.notes(),
            request.website()
        ), extractUserId(user)).map(mapper::toDto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('suppliers:update')")
    public Mono<SupplierDto> update(@PathVariable UUID id,
                                    @Valid @RequestBody UpdateSupplierRequest request,
                                    @AuthenticationPrincipal UserDetails user) {
        return commandPort.update(id, new SupplierCommandPort.UpdateCommand(
            request.code(),
            request.name(),
            request.contactName(),
            request.phone(),
            request.email(),
            request.address(),
            request.notes(),
            request.website()
        ), extractUserId(user)).map(mapper::toDto);
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('suppliers:update')")
    public Mono<SupplierDto> activate(@PathVariable UUID id,
                                      @AuthenticationPrincipal UserDetails user) {
        return commandPort.activate(id, extractUserId(user)).map(mapper::toDto);
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('suppliers:update')")
    public Mono<SupplierDto> deactivate(@PathVariable UUID id,
                                        @AuthenticationPrincipal UserDetails user) {
        return commandPort.deactivate(id, extractUserId(user)).map(mapper::toDto);
    }

    @DeleteMapping("/batch")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('suppliers:delete')")
    public Mono<Void> deleteBatch(@RequestBody List<UUID> ids) {
        return commandPort.deleteAll(ids);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('suppliers:delete')")
    public Mono<Void> delete(@PathVariable UUID id,
                             @AuthenticationPrincipal UserDetails user) {
        return commandPort.delete(id, extractUserId(user));
    }

    private UUID extractUserId(UserDetails user) {
        return UUID.fromString(user.getUsername());
    }
}
