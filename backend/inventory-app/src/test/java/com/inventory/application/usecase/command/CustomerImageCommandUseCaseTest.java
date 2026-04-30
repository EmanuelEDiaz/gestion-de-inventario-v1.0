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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

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

    @Test
    void upload_multipleShouldSaveAllWithCorrectSortOrder() {
        // Arrange — dos imágenes con sortOrder distintos
        var cmd0 = new com.inventory.domain.ports.in.CustomerImageCommandPort.UploadCommand(
            customerId, false, "image/png", "/uploads/img0.png", "img0.png", 1024L, 0
        );
        var cmd1 = new com.inventory.domain.ports.in.CustomerImageCommandPort.UploadCommand(
            customerId, false, "image/jpeg", "/uploads/img1.jpg", "img1.jpg", 2048L, 1
        );
        CustomerImage saved0 = CustomerImage.create(customerId, 0, false, "image/png", "/uploads/img0.png", "img0.png", 1024L);
        CustomerImage saved1 = CustomerImage.create(customerId, 1, false, "image/jpeg", "/uploads/img1.jpg", "img1.jpg", 2048L);

        when(customerImageRepository.save(any()))
            .thenReturn(Mono.just(saved0))
            .thenReturn(Mono.just(saved1));

        // Act & Assert — primera imagen
        StepVerifier.create(useCase.upload(cmd0))
            .assertNext(img -> {
                assert img.sortOrder() == 0 : "primera imagen debe tener sortOrder=0";
                assert img.contentType().equals("image/png");
                assert img.sizeBytes() == 1024L;
            })
            .verifyComplete();

        // Act & Assert — segunda imagen
        StepVerifier.create(useCase.upload(cmd1))
            .assertNext(img -> {
                assert img.sortOrder() == 1 : "segunda imagen debe tener sortOrder=1";
                assert img.contentType().equals("image/jpeg");
                assert img.sizeBytes() == 2048L;
            })
            .verifyComplete();
    }

    @Test
    void listByCustomer_shouldReturnAllImagesForCustomer() {
        // Arrange
        CustomerImage img1 = CustomerImage.create(customerId, 0, true, "image/png", "/a.png", "a.png", 500L);
        CustomerImage img2 = CustomerImage.create(customerId, 1, false, "image/jpeg", "/b.jpg", "b.jpg", 800L);
        CustomerImage img3 = CustomerImage.create(customerId, 2, false, "image/webp", "/c.webp", "c.webp", 300L);

        when(customerImageRepository.findByCustomerId(customerId))
            .thenReturn(Flux.just(img1, img2, img3));

        // Act & Assert
        StepVerifier.create(useCase.listByCustomer(customerId))
            .assertNext(img -> { assertEquals(0, img.sortOrder()); assertTrue(img.isPrimary()); })
            .assertNext(img -> { assertEquals(1, img.sortOrder()); assertFalse(img.isPrimary()); })
            .assertNext(img -> { assertEquals(2, img.sortOrder()); assertFalse(img.isPrimary()); })
            .verifyComplete();
    }
}
