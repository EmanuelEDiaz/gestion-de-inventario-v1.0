package com.inventory.adapters.web.controller;

import com.inventory.application.dto.CustomerImageDto;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.ports.in.CustomerImageCommandPort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customers/{customerId}/images")
public class CustomerImageController {

    private final CustomerImageCommandPort commandPort;
    private final SupplementaryApplicationMapper mapper;

    public CustomerImageController(CustomerImageCommandPort commandPort,
                                   SupplementaryApplicationMapper mapper) {
        this.commandPort = commandPort;
        this.mapper = mapper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER')")
    public Flux<CustomerImageDto> listImages(@PathVariable UUID customerId) {
        return commandPort.listByCustomer(customerId).map(mapper::toDto);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<CustomerImageDto> upload(
        @PathVariable UUID customerId,
        @RequestBody UploadRequest body
    ) {
        return commandPort.upload(new CustomerImageCommandPort.UploadCommand(
            customerId, body.isPrimary(), body.contentType(),
            body.filePath(), body.originalFilename(), body.sizeBytes(), body.sortOrder()
        )).map(mapper::toDto);
    }

    @PostMapping("/{imageId}/primary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<CustomerImageDto> setPrimary(
        @PathVariable UUID customerId,
        @PathVariable UUID imageId
    ) {
        return commandPort.setPrimary(imageId).map(mapper::toDto);
    }

    @DeleteMapping("/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<Void> delete(
        @PathVariable UUID customerId,
        @PathVariable UUID imageId
    ) {
        return commandPort.delete(imageId);
    }

    record UploadRequest(
        boolean isPrimary,
        String contentType,
        String filePath,
        String originalFilename,
        long sizeBytes,
        int sortOrder
    ) {}
}
