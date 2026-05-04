package com.inventory.application.usecase.command;

import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.ProductImage;
import com.inventory.domain.ports.in.ProductImageCommandPort;
import com.inventory.domain.ports.out.ProductImageRepository;
import com.inventory.domain.ports.out.ProductRepository;
import com.inventory.application.service.ImageProcessingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;
import java.util.UUID;

@Service
public class ProductImageCommandUseCase implements ProductImageCommandPort {

    private static final int MAX_IMAGES_PER_PRODUCT = 8;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_SIZE_BYTES = 10 * 1024 * 1024;

    private final ProductImageRepository repository;
    private final ImageProcessingService imageService;
    private final ProductRepository productRepository;

    public ProductImageCommandUseCase(ProductImageRepository repository,
                                       ImageProcessingService imageService,
                                       ProductRepository productRepository) {
        this.repository = repository;
        this.imageService = imageService;
        this.productRepository = productRepository;
    }

    @Override
    public Mono<ProductImage> uploadWithFile(UploadFileCommand command) {
        if (!ALLOWED_TYPES.contains(command.contentType())) {
            return Mono.error(new BadRequestException("Tipo de imagen no permitido: " + command.contentType()));
        }
        if (command.fileData().length > MAX_SIZE_BYTES) {
            return Mono.error(new BadRequestException("El archivo supera 10 MB"));
        }
        
        return repository.countByProductId(command.productId())
            .flatMap(count -> {
                if (count >= MAX_IMAGES_PER_PRODUCT) {
                    return Mono.error(new BadRequestException("Máximo 8 imágenes por producto"));
                }
                try {
                    String filePath = imageService.processAndSave(
                        command.productId(), 
                        command.fileData(), 
                        command.originalFilename(),
                        command.contentType()
                    );
                    int sortOrder = count.intValue();
                    ProductImage image = ProductImage.create(
                        command.productId(), sortOrder, command.isPrimary(),
                        command.contentType(), filePath, command.originalFilename(),
                        command.fileData().length
                    );
                    return repository.save(image)
                        .flatMap(saved -> {
                            if (saved.isPrimary()) {
                                return productRepository.updateMainImage(saved.productId(), saved.filePath())
                                    .thenReturn(saved);
                            }
                            return Mono.just(saved);
                        });
                } catch (Exception e) {
                    return Mono.error(new BadRequestException("Error al procesar imagen: " + e.getMessage()));
                }
            });
    }

    @Override
    public Mono<ProductImage> upload(UploadCommand command) {
        ProductImage image = ProductImage.create(
            command.productId(), command.sortOrder(), command.isPrimary(),
            command.contentType(), command.filePath(), command.originalFilename(),
            command.sizeBytes()
        );
        return repository.save(image);
    }

    @Override
    @Transactional
    public Mono<ProductImage> setPrimary(UUID imageId) {
        return repository.findById(imageId)
            .switchIfEmpty(Mono.error(new NotFoundException("Imagen no encontrada: " + imageId)))
            .flatMap(target ->
                repository.findByProductId(target.productId())
                    .filter(other -> !other.id().equals(imageId) && other.isPrimary())
                    .flatMap(other -> repository.save(
                        new ProductImage(other.id(), other.productId(), other.sortOrder(),
                            false, other.contentType(), other.filePath(),
                            other.originalFilename(), other.sizeBytes(), other.createdAt())
                    ))
                    .then(repository.save(
                        new ProductImage(target.id(), target.productId(), target.sortOrder(),
                            true, target.contentType(), target.filePath(),
                            target.originalFilename(), target.sizeBytes(), target.createdAt())
                    ))
                    .flatMap(saved -> productRepository.updateMainImage(saved.productId(), saved.filePath())
                        .thenReturn(saved))
            );
    }

    @Override
    public Mono<Void> delete(UUID imageId) {
        return repository.findById(imageId)
            .switchIfEmpty(Mono.error(new NotFoundException("Imagen no encontrada: " + imageId)))
            .flatMap(image -> repository.deleteById(imageId)
                .then(image.isPrimary()
                    ? productRepository.clearMainImage(image.productId())
                    : Mono.empty()));
    }

    @Override
    public Flux<ProductImage> listByProduct(UUID productId) {
        return repository.findByProductId(productId);
    }

    @Override
    public Mono<Long> countByProductId(UUID productId) {
        return repository.countByProductId(productId);
    }
}