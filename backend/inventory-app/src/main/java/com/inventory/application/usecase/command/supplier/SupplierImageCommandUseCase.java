package com.inventory.application.usecase.command.supplier;

import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.model.supplier.SupplierImage;
import com.inventory.domain.ports.in.supplier.SupplierImageCommandPort;
import com.inventory.domain.ports.out.SupplierImageRepository;
import com.inventory.application.service.ImageProcessingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;
import java.util.UUID;

/**
 * Caso de uso: comandos sobre imágenes de proveedores.
 */
@Service
public class SupplierImageCommandUseCase implements SupplierImageCommandPort {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_SIZE_BYTES = 5 * 1024 * 1024;

    private final SupplierImageRepository supplierImageRepository;
    private final ImageProcessingService imageService;

    public SupplierImageCommandUseCase(SupplierImageRepository supplierImageRepository,
                                       ImageProcessingService imageService) {
        this.supplierImageRepository = supplierImageRepository;
        this.imageService = imageService;
    }

    @Override
    public Mono<SupplierImage> uploadWithFile(UploadFileCommand command) {
        if (!ALLOWED_TYPES.contains(command.contentType())) {
            return Mono.error(new BadRequestException("Tipo de imagen no permitido: " + command.contentType()));
        }
        if (command.fileData().length > MAX_SIZE_BYTES) {
            return Mono.error(new BadRequestException("El archivo supera 5 MB"));
        }

        return supplierImageRepository.findBySupplierId(command.supplierId()).count()
            .flatMap(count -> {
                try {
                    String filePath = imageService.processAndSaveSupplier(
                        command.supplierId(),
                        command.fileData(),
                        command.originalFilename(),
                        command.contentType()
                    );

                    int sortOrder = command.sortOrder() >= 0 ? command.sortOrder() : count.intValue();
                    SupplierImage image = SupplierImage.create(
                        command.supplierId(),
                        sortOrder,
                        command.isPrimary(),
                        command.contentType(),
                        filePath,
                        command.originalFilename(),
                        command.fileData().length
                    );
                    return supplierImageRepository.save(image);
                } catch (Exception e) {
                    return Mono.error(new BadRequestException("Error al procesar imagen: " + e.getMessage()));
                }
            });
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
