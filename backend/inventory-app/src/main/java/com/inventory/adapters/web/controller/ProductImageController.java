package com.inventory.adapters.web.controller;

import com.inventory.application.product.dto.ProductImageDto;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.ports.in.product.ProductImageCommandPort;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Base64;
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

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<ProductImageDto> uploadJson(
        @PathVariable UUID productId,
        @RequestBody UploadRequest body
    ) {
        try {
            byte[] fileData = Base64.getDecoder().decode(body.fileData());
            var command = new ProductImageCommandPort.UploadFileCommand(
                productId, fileData, body.originalFilename(),
                body.contentType(), body.isPrimary()
            );
            return commandPort.uploadWithFile(command).map(mapper::toDto);
        } catch (IllegalArgumentException e) {
            return Mono.error(new RuntimeException("Datos Base64 inválidos: " + e.getMessage()));
        } catch (Exception e) {
            return Mono.error(new RuntimeException("Error al procesar imagen: " + e.getMessage()));
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<ProductImageDto> uploadMultipart(
        @PathVariable UUID productId,
        @RequestPart("file") FilePart file,
        @RequestPart(value = "isPrimary", required = false) String isPrimary
    ) {
        return DataBufferUtils.join(file.content())
            .map(dataBuffer -> {
                byte[] bytes = new byte[dataBuffer.readableByteCount()];
                dataBuffer.read(bytes);
                DataBufferUtils.release(dataBuffer);
                return bytes;
            })
            .flatMap(fileData -> {
                var command = new ProductImageCommandPort.UploadFileCommand(
                    productId,
                    fileData,
                    file.filename(),
                    file.headers().getContentType() == null
                        ? "application/octet-stream"
                        : file.headers().getContentType().toString(),
                    Boolean.parseBoolean(isPrimary == null ? "false" : isPrimary)
                );
                return commandPort.uploadWithFile(command).map(mapper::toDto);
            });
    }

    record UploadRequest(
        boolean isPrimary,
        String contentType,
        String originalFilename,
        String fileData
    ) {}

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