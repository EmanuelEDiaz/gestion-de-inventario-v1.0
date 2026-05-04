package com.inventory.application.usecase.command;

import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.model.CustomerImage;
import com.inventory.domain.ports.in.CustomerImageCommandPort;
import com.inventory.domain.ports.out.CustomerImageRepository;
import com.inventory.application.service.ImageProcessingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Set;
import java.util.UUID;

/**
 * Caso de uso: comandos sobre imágenes de clientes.
 */
@Service
public class CustomerImageCommandUseCase implements CustomerImageCommandPort {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_SIZE_BYTES = 5 * 1024 * 1024;

    private final CustomerImageRepository customerImageRepository;
    private final ImageProcessingService imageService;

    public CustomerImageCommandUseCase(CustomerImageRepository customerImageRepository,
                                       ImageProcessingService imageService) {
        this.customerImageRepository = customerImageRepository;
        this.imageService = imageService;
    }

    @Override
    public Mono<CustomerImage> uploadWithFile(UploadFileCommand command) {
        if (!ALLOWED_TYPES.contains(command.contentType())) {
            return Mono.error(new BadRequestException("Tipo de imagen no permitido: " + command.contentType()));
        }
        if (command.fileData().length > MAX_SIZE_BYTES) {
            return Mono.error(new BadRequestException("El archivo supera 5 MB"));
        }

        return customerImageRepository.findByCustomerId(command.customerId()).count()
            .flatMap(count -> {
                try {
                    String filePath = imageService.processAndSaveCustomer(
                        command.customerId(),
                        command.fileData(),
                        command.originalFilename(),
                        command.contentType()
                    );

                    int sortOrder = command.sortOrder() >= 0 ? command.sortOrder() : count.intValue();
                    CustomerImage image = CustomerImage.create(
                        command.customerId(),
                        sortOrder,
                        command.isPrimary(),
                        command.contentType(),
                        filePath,
                        command.originalFilename(),
                        command.fileData().length
                    );
                    return customerImageRepository.save(image);
                } catch (Exception e) {
                    return Mono.error(new BadRequestException("Error al procesar imagen: " + e.getMessage()));
                }
            });
    }

    @Override
    public Mono<CustomerImage> upload(UploadCommand command) {
        CustomerImage image = CustomerImage.create(
            command.customerId(),
            command.sortOrder(),
            command.isPrimary(),
            command.contentType(),
            command.filePath(),
            command.originalFilename(),
            command.sizeBytes()
        );
        return customerImageRepository.save(image);
    }

    @Override
    public Mono<Void> delete(UUID imageId) {
        return customerImageRepository.existsById(imageId)
            .flatMap(exists -> exists
                ? customerImageRepository.deleteById(imageId)
                : Mono.error(new NotFoundException("CustomerImage not found: " + imageId)));
    }

    @Override
    @Transactional
    public Mono<CustomerImage> setPrimary(UUID imageId) {
        return customerImageRepository.findById(imageId)
            .switchIfEmpty(Mono.error(new NotFoundException("CustomerImage not found: " + imageId)))
            .flatMap(target ->
                customerImageRepository.findByCustomerId(target.customerId())
                    .filter(other -> !other.id().equals(imageId) && other.isPrimary())
                    .flatMap(other -> customerImageRepository.save(
                        new CustomerImage(other.id(), other.customerId(), other.sortOrder(),
                            false, other.contentType(), other.filePath(),
                            other.originalFilename(), other.sizeBytes(), other.createdAt())
                    ))
                    .then(customerImageRepository.save(
                        new CustomerImage(target.id(), target.customerId(), target.sortOrder(),
                            true, target.contentType(), target.filePath(),
                            target.originalFilename(), target.sizeBytes(), target.createdAt())
                    ))
            );
    }

    @Override
    public Flux<CustomerImage> listByCustomer(UUID customerId) {
        return customerImageRepository.findByCustomerId(customerId);
    }
}
