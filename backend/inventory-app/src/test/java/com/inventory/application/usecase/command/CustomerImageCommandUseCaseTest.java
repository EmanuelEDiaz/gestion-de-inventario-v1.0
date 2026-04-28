package com.inventory.application.usecase.command;

import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.CustomerImage;
import com.inventory.domain.ports.out.CustomerImageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerImageCommandUseCaseTest {

    @Mock
    private CustomerImageRepository customerImageRepository;

    private CustomerImageCommandUseCase useCase;

    private final UUID customerId = UUID.randomUUID();
    private final UUID imageId    = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        useCase = new CustomerImageCommandUseCase(customerImageRepository);
    }

    @Test
    void upload_shouldSaveAndReturnImage() {
        // Arrange
        var command = new com.inventory.domain.ports.in.CustomerImageCommandPort.UploadCommand(
            customerId, false, "image/png", "/uploads/img.png", "img.png", 1024L, 0
        );
        CustomerImage saved = CustomerImage.create(customerId, 0, false, "image/png", "/uploads/img.png", "img.png", 1024L);
        when(customerImageRepository.save(any())).thenReturn(Mono.just(saved));

        // Act & Assert
        StepVerifier.create(useCase.upload(command))
            .assertNext(img -> {
                assert img.customerId().equals(customerId);
                assert img.contentType().equals("image/png");
            })
            .verifyComplete();
    }

    @Test
    void delete_shouldDeleteWhenExists() {
        // Arrange
        when(customerImageRepository.existsById(imageId)).thenReturn(Mono.just(true));
        when(customerImageRepository.deleteById(imageId)).thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(useCase.delete(imageId))
            .verifyComplete();
    }

    @Test
    void delete_shouldThrowNotFoundWhenMissing() {
        // Arrange
        when(customerImageRepository.existsById(imageId)).thenReturn(Mono.just(false));

        // Act & Assert
        StepVerifier.create(useCase.delete(imageId))
            .expectError(NotFoundException.class)
            .verify();
    }

    @Test
    void setPrimary_shouldUpdatePrimaryFlag() {
        // Arrange
        CustomerImage target  = new CustomerImage(imageId, customerId, 0, false, "image/png", "/a.png", "a.png", 100L, Instant.now());
        CustomerImage other   = new CustomerImage(UUID.randomUUID(), customerId, 1, true, "image/png", "/b.png", "b.png", 200L, Instant.now());

        when(customerImageRepository.findById(imageId)).thenReturn(Mono.just(target));
        when(customerImageRepository.findByCustomerId(customerId)).thenReturn(Flux.just(target, other));
        when(customerImageRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        // Act & Assert
        StepVerifier.create(useCase.setPrimary(imageId))
            .assertNext(img -> {
                assert img.id().equals(imageId);
                assert img.isPrimary();
            })
            .verifyComplete();
    }

    @Test
    void setPrimary_shouldThrowNotFoundWhenMissing() {
        // Arrange
        when(customerImageRepository.findById(imageId)).thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(useCase.setPrimary(imageId))
            .expectError(NotFoundException.class)
            .verify();
    }
}
