package com.inventory.adapters.web.controller.customer;

import com.inventory.application.customer.dto.CustomerDebtDto;
import com.inventory.application.customer.dto.DebtPaymentDto;
import com.inventory.application.customer.dto.RegisterDebtPaymentRequest;
import com.inventory.application.customer.dto.UpdateDebtRequest;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.model.customer.CustomerDebt;
import com.inventory.domain.model.customer.DebtPayment;
import com.inventory.domain.ports.in.customer.CustomerDebtCommandPort;
import com.inventory.domain.ports.in.customer.CustomerDebtQueryPort;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/debts")
public class CustomerDebtController {

    private final CustomerDebtCommandPort commandPort;
    private final CustomerDebtQueryPort queryPort;
    private final SupplementaryApplicationMapper mapper;

    public CustomerDebtController(CustomerDebtCommandPort commandPort,
                                  CustomerDebtQueryPort queryPort,
                                  SupplementaryApplicationMapper mapper) {
        this.commandPort = commandPort;
        this.queryPort = queryPort;
        this.mapper = mapper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('finance:read')")
    public Flux<CustomerDebtDto> listAll(
        @RequestParam(required = false) String status
    ) {
        if (status != null) {
            return queryPort.listAll(CustomerDebt.DebtStatus.valueOf(status.toUpperCase())).map(mapper::toDto);
        }
        return queryPort.findAll().map(mapper::toDto);
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('finance:read')")
    public Flux<CustomerDebtDto> listOverdue() {
        return queryPort.listOverdue().map(mapper::toDto);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('finance:read')")
    public Mono<CustomerDebtDto> getById(@PathVariable UUID id) {
        return queryPort.getById(id).map(mapper::toDto);
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('finance:read')")
    public Flux<CustomerDebtDto> listByCustomer(@PathVariable UUID customerId) {
        return queryPort.listByCustomer(customerId).map(mapper::toDto);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') || hasAuthority('finance:update')")
    public Mono<CustomerDebtDto> update(
        @PathVariable UUID id,
        @RequestBody UpdateDebtRequest request
    ) {
        return commandPort.update(id, new CustomerDebtCommandPort.UpdateCommand(
            request.description(),
            request.dueDate(),
            request.notes()
        )).map(mapper::toDto);
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('finance:delete')")
    public Mono<CustomerDebtDto> cancel(@PathVariable UUID id) {
        return commandPort.cancel(id).map(mapper::toDto);
    }

    @PostMapping("/{id}/payments")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('finance:create')")
    public Mono<DebtPaymentDto> registerPayment(
        @PathVariable UUID id,
        @Valid @RequestBody RegisterDebtPaymentRequest request,
        @AuthenticationPrincipal UserDetails userDetails
    ) {
        UUID userId = extractUserId(userDetails);
        DebtPayment.PaymentMethod method = request.paymentMethod() != null
            ? DebtPayment.PaymentMethod.valueOf(request.paymentMethod())
            : DebtPayment.PaymentMethod.CASH;
        return commandPort.registerPayment(new CustomerDebtCommandPort.RegisterPaymentCommand(
            id, request.amount(), method, request.notes(), userId
        )).map(mapper::toDto);
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
