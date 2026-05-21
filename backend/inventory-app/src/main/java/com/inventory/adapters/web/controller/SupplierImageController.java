package com.inventory.adapters.web.controller;

import com.inventory.application.supplier.dto.SupplierImageDto;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.ports.in.SupplierImageCommandPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.buffer.DataBufferUtils;
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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<SupplierImageDto> upload(
        @PathVariable UUID supplierId,
        @RequestPart("file") FilePart file,
        @RequestPart(value = "isPrimary", required = false) String isPrimary,
        @RequestPart(value = "sortOrder", required = false) String sortOrder
    ) {
        return readBytes(file)
            .flatMap(bytes -> commandPort.uploadWithFile(new SupplierImageCommandPort.UploadFileCommand(
                supplierId,
                Boolean.parseBoolean(isPrimary == null ? "false" : isPrimary),
                bytes,
                file.filename(),
                file.headers().getContentType() == null
                    ? "application/octet-stream"
                    : file.headers().getContentType().toString(),
                sortOrder == null || sortOrder.isBlank() ? -1 : Integer.parseInt(sortOrder)
            )))
            .map(mapper::toDto);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Mono<SupplierImageDto> uploadLegacy(
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

    private Mono<byte[]> readBytes(FilePart file) {
        return DataBufferUtils.join(file.content())
            .map(dataBuffer -> {
                byte[] bytes = new byte[dataBuffer.readableByteCount()];
                dataBuffer.read(bytes);
                DataBufferUtils.release(dataBuffer);
                return bytes;
            });
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
