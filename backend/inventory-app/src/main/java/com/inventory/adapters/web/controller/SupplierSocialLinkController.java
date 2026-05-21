package com.inventory.adapters.web.controller;

import com.inventory.application.dto.AddSocialLinkRequest;
import com.inventory.application.dto.SupplierSocialLinkDto;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.model.supplier.SupplierSocialLink;
import com.inventory.domain.ports.in.SupplierSocialLinkCommandPort;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/suppliers/{supplierId}/social-links")
public class SupplierSocialLinkController {

    private final SupplierSocialLinkCommandPort commandPort;
    private final SupplementaryApplicationMapper mapper;

    public SupplierSocialLinkController(SupplierSocialLinkCommandPort commandPort,
                                        SupplementaryApplicationMapper mapper) {
        this.commandPort = commandPort;
        this.mapper = mapper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER')")
    public Flux<SupplierSocialLinkDto> list(@PathVariable UUID supplierId) {
        return commandPort.listBySupplierId(supplierId).map(mapper::toDto);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<SupplierSocialLinkDto> add(
        @PathVariable UUID supplierId,
        @Valid @RequestBody AddSocialLinkRequest request
    ) {
        return commandPort.add(new SupplierSocialLinkCommandPort.AddCommand(
            supplierId,
            SupplierSocialLink.Platform.valueOf(request.platform()),
            request.url(),
            request.label(),
            request.sortOrder()
        )).map(mapper::toDto);
    }

    @DeleteMapping("/{linkId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<Void> delete(
        @PathVariable UUID supplierId,
        @PathVariable UUID linkId
    ) {
        return commandPort.delete(linkId);
    }
}
