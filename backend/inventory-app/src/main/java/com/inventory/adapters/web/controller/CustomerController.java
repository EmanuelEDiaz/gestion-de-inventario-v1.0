package com.inventory.adapters.web.controller;

import com.inventory.application.customer.dto.CreateCustomerRequest;
import com.inventory.application.customer.dto.CustomerDto;
import com.inventory.application.customer.dto.UpdateCustomerRequest;
import com.inventory.application.mapper.CustomerMapper;
import com.inventory.domain.ports.in.customer.CustomerCommandPort;
import com.inventory.domain.ports.in.customer.CustomerQueryPort;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

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
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER')")
    public Flux<CustomerDto> findAll(@RequestParam(required = false) Boolean active) {
        if (active != null) {
            return queryPort.findByActive(active).map(mapper::toDto);
        }
        return queryPort.findAll().map(mapper::toDto);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER')")
    public Mono<CustomerDto> findById(@PathVariable UUID id) {
        return queryPort.findById(id).map(mapper::toDto);
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER')")
    public Mono<CustomerDto> findByCode(@PathVariable String code) {
        return queryPort.findByCode(code).map(mapper::toDto);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER')")
    public Flux<CustomerDto> search(@RequestParam String q) {
        return queryPort.search(q).map(mapper::toDto);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<CustomerDto> create(@Valid @RequestBody CreateCustomerRequest request) {
        return commandPort.create(new CustomerCommandPort.CreateCommand(
            request.code(),
            request.name(),
            request.contactName(),
            request.phone(),
            request.email(),
            request.address(),
            request.notes()
        )).map(mapper::toDto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<CustomerDto> update(@PathVariable UUID id, 
                                    @Valid @RequestBody UpdateCustomerRequest request) {
        return commandPort.update(id, new CustomerCommandPort.UpdateCommand(
            request.code(),
            request.name(),
            request.contactName(),
            request.phone(),
            request.email(),
            request.address(),
            request.notes()
        )).map(mapper::toDto);
    }

    @PostMapping("/{id}/activate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<CustomerDto> activate(@PathVariable UUID id) {
        return commandPort.activate(id).map(mapper::toDto);
    }

    @PostMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<CustomerDto> deactivate(@PathVariable UUID id) {
        return commandPort.deactivate(id).map(mapper::toDto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public Mono<Void> delete(@PathVariable UUID id) {
        return commandPort.delete(id);
    }
}
