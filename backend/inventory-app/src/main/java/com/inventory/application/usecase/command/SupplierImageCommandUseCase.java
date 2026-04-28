package com.inventory.application.usecase.command;

import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.SupplierImage;
import com.inventory.domain.ports.in.SupplierImageCommandPort;
import com.inventory.domain.ports.out.SupplierImageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: comandos sobre imágenes de proveedores.
 */
@Service
public class SupplierImageCommandUseCase implements SupplierImageCommandPort {

    private final SupplierImageRepository supplierImageRepository;

    public SupplierImageCommandUseCase(SupplierImageRepository supplierImageRepository) {
        this.supplierImageRepository = supplierImageRepository;
    }

    @Override
    public Mono<SupplierImage> upload(UploadCommand command) {
        SupplierImage image = SupplierImage.create(
            command.supplierId(),
            command.sortOrder(),
            command.isPrimary(),
            command.contentType(),
            command.filePath(),
            command.originalFilename(),
            command.sizeBytes()
        );
        return supplierImageRepository.save(image);
    }

    @Override
    public Mono<Void> delete(UUID imageId) {
        return supplierImageRepository.findById(imageId)
            .switchIfEmpty(Mono.error(new NotFoundException("SupplierImage not found: " + imageId)))
            .flatMap(img -> supplierImageRepository.deleteById(imageId));
    }

    @Override
    @Transactional
    public Mono<SupplierImage> setPrimary(UUID imageId) {
        return supplierImageRepository.findById(imageId)
            .switchIfEmpty(Mono.error(new NotFoundException("SupplierImage not found: " + imageId)))
            .flatMap(target ->
                supplierImageRepository.findBySupplierId(target.supplierId())
                    .filter(other -> !other.id().equals(imageId) && other.isPrimary())
                    .flatMap(other -> supplierImageRepository.save(
                        new SupplierImage(other.id(), other.supplierId(), other.sortOrder(),
                            false, other.contentType(), other.filePath(),
                            other.originalFilename(), other.sizeBytes(), other.createdAt())
                    ))
                    .then(supplierImageRepository.save(
                        new SupplierImage(target.id(), target.supplierId(), target.sortOrder(),
                            true, target.contentType(), target.filePath(),
                            target.originalFilename(), target.sizeBytes(), target.createdAt())
                    ))
            );
    }

    @Override
    public Flux<SupplierImage> listBySupplierId(UUID supplierId) {
        return supplierImageRepository.findBySupplierId(supplierId);
    }
}
