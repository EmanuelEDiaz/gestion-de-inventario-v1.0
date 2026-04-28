package com.inventory.application.usecase.command;

import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.CustomerImage;
import com.inventory.domain.ports.in.CustomerImageCommandPort;
import com.inventory.domain.ports.out.CustomerImageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Caso de uso: comandos sobre imágenes de clientes.
 */
@Service
public class CustomerImageCommandUseCase implements CustomerImageCommandPort {

    private final CustomerImageRepository customerImageRepository;

    public CustomerImageCommandUseCase(CustomerImageRepository customerImageRepository) {
        this.customerImageRepository = customerImageRepository;
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
