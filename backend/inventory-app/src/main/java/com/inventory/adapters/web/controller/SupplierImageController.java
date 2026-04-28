package com.inventory.adapters.web.controller;

import com.inventory.application.dto.SupplierImageDto;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.ports.in.SupplierImageCommandPort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/suppliers/{supplierId}/images")
public class SupplierImageController {

    private final SupplierImageCommandPort commandPort;
    private final SupplementaryApplicationMapper mapper;

    public SupplierImageController(SupplierImageCommandPort commandPort,
                                   SupplementaryApplicationMapper mapper) {
        this.commandPort = commandPort;
        this.mapper = mapper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER')")
    public Flux<SupplierImageDto> listImages(@PathVariable UUID supplierId) {
        return commandPort.listBySupplierId(supplierId).map(mapper::toDto);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<SupplierImageDto> upload(
        @PathVariable UUID supplierId,
        @RequestBody UploadRequest body
    ) {
        return commandPort.upload(new SupplierImageCommandPort.UploadCommand(
            supplierId, body.isPrimary(), body.contentType(),
            body.filePath(), body.originalFilename(), body.sizeBytes(), body.sortOrder()
        )).map(mapper::toDto);
    }

    @PostMapping("/{imageId}/primary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<SupplierImageDto> setPrimary(
        @PathVariable UUID supplierId,
        @PathVariable UUID imageId
    ) {
        return commandPort.setPrimary(imageId).map(mapper::toDto);
    }

    @DeleteMapping("/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<Void> delete(
        @PathVariable UUID supplierId,
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
