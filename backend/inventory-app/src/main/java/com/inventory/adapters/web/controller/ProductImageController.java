package com.inventory.adapters.web.controller;

import com.inventory.application.dto.ProductImageDto;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.ports.in.ProductImageCommandPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products/{productId}/images")
public class ProductImageController {

    private final ProductImageCommandPort commandPort;
    private final SupplementaryApplicationMapper mapper;

    public ProductImageController(ProductImageCommandPort commandPort,
                                   SupplementaryApplicationMapper mapper) {
        this.commandPort = commandPort;
        this.mapper = mapper;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER')")
    public Flux<ProductImageDto> listImages(@PathVariable UUID productId) {
        return commandPort.listByProduct(productId).map(mapper::toDto);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<ProductImageDto> upload(
        @PathVariable UUID productId,
        @RequestPart("file") MultipartFile file,
        @RequestPart(value = "isPrimary", required = false) String isPrimaryParam
    ) {
        boolean isPrimary = "true".equalsIgnoreCase(isPrimaryParam);
        try {
            byte[] fileData = file.getBytes();
            var command = new ProductImageCommandPort.UploadFileCommand(
                productId, fileData, file.getOriginalFilename(),
                file.getContentType(), isPrimary
            );
            return commandPort.uploadWithFile(command).map(mapper::toDto);
        } catch (Exception e) {
            return Mono.error(new RuntimeException("Error al procesar imagen: " + e.getMessage()));
        }
    }

    @PostMapping("/{imageId}/primary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<ProductImageDto> setPrimary(
        @PathVariable UUID productId,
        @PathVariable UUID imageId
    ) {
        return commandPort.setPrimary(imageId).map(mapper::toDto);
    }

    @DeleteMapping("/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<Void> delete(
        @PathVariable UUID productId,
        @PathVariable UUID imageId
    ) {
        return commandPort.delete(imageId);
    }
}