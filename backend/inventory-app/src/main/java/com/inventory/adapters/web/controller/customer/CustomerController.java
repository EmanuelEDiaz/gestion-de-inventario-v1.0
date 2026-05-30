package com.inventory.adapters.web.controller.customer;

import com.inventory.application.customer.dto.CreateCustomerRequest;
import com.inventory.application.customer.dto.CustomerDto;
import com.inventory.application.customer.dto.UpdateCustomerRequest;
import com.inventory.application.mapper.CustomerMapper;
import com.inventory.domain.ports.in.customer.CustomerCommandPort;
import com.inventory.domain.ports.in.customer.CustomerQueryPort;
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
 * REST Controller para gestión de clientes.
 */
@RestController
@RequestMapping("/api/v1/customers")
public class CustomerController {

    private final CustomerCommandPort commandPort;
    private final CustomerQueryPort queryPort;
    private final CustomerMapper mapper;

    public CustomerController(CustomerCommandPort commandPort, 
                              CustomerQueryPort queryPort, 
                              CustomerMapper mapper) {
        this.commandPort = commandPort;
        this.queryPort = queryPort;
        this.mapper = mapper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('customers:read')")
    public Flux<CustomerDto> findAll(@RequestParam(required = false) Boolean active) {
        if (active != null) {
            return queryPort.findByActive(active).map(mapper::toDto);
        }
        return queryPort.findAll().map(mapper::toDto);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('customers:read')")
    public Mono<CustomerDto> findById(@PathVariable UUID id) {
        return queryPort.findById(id).map(mapper::toDto);
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('customers:read')")
    public Mono<CustomerDto> findByCode(@PathVariable String code) {
        return queryPort.findByCode(code).map(mapper::toDto);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('customers:read')")
    public Flux<CustomerDto> search(@RequestParam String q) {
        return queryPort.search(q).map(mapper::toDto);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('customers:create')")
    public Mono<CustomerDto> create(@Valid @RequestBody CreateCustomerRequest request,
                                    @AuthenticationPrincipal UserDetails user) {
        return commandPort.create(new CustomerCommandPort.CreateCommand(
            request.code(),
            request.name(),
            request.contactName(),
            request.phone(),
            request.email(),
            request.address(),
            request.notes()
        ), extractUserId(user)).map(mapper::toDto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('customers:update')")
    public Mono<CustomerDto> update(@PathVariable UUID id, 
                                    @Valid @RequestBody UpdateCustomerRequest request,
                                    @AuthenticationPrincipal UserDetails user) {
        return commandPort.update(id, new CustomerCommandPort.UpdateCommand(
            request.code(),
            request.name(),
            request.contactName(),
            request.phone(),
            request.email(),
            request.address(),
            request.notes()
        ), extractUserId(user)).map(mapper::toDto);
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('customers:update')")
    public Mono<CustomerDto> activate(@PathVariable UUID id,
                                      @AuthenticationPrincipal UserDetails user) {
        return commandPort.activate(id, extractUserId(user)).map(mapper::toDto);
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('customers:update')")
    public Mono<CustomerDto> deactivate(@PathVariable UUID id,
                                        @AuthenticationPrincipal UserDetails user) {
        return commandPort.deactivate(id, extractUserId(user)).map(mapper::toDto);
    }

    @DeleteMapping("/batch")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('customers:delete')")
    public Mono<Void> deleteBatch(@RequestBody List<UUID> ids) {
        return commandPort.deleteAll(ids);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('customers:delete')")
    public Mono<Void> delete(@PathVariable UUID id,
                             @AuthenticationPrincipal UserDetails user) {
        return commandPort.delete(id, extractUserId(user));
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
