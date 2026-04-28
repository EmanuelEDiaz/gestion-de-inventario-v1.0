package com.inventory.application.usecase.command;

import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.SupplierImage;
import com.inventory.domain.ports.out.SupplierImageRepository;
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
class SupplierImageCommandUseCaseTest {

    @Mock
    private SupplierImageRepository supplierImageRepository;

    private SupplierImageCommandUseCase useCase;

    private final UUID supplierId = UUID.randomUUID();
    private final UUID imageId    = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        useCase = new SupplierImageCommandUseCase(supplierImageRepository);
    }

    @Test
    void upload_shouldSaveAndReturnImage() {
        // Arrange
        var command = new com.inventory.domain.ports.in.SupplierImageCommandPort.UploadCommand(
            supplierId, false, "image/jpeg", "/uploads/s.jpg", "s.jpg", 512L, 0
        );
        SupplierImage saved = SupplierImage.create(supplierId, 0, false, "image/jpeg", "/uploads/s.jpg", "s.jpg", 512L);
        when(supplierImageRepository.save(any())).thenReturn(Mono.just(saved));

        // Act & Assert
        StepVerifier.create(useCase.upload(command))
            .assertNext(img -> {
                assert img.supplierId().equals(supplierId);
                assert !img.isPrimary();
            })
            .verifyComplete();
    }

    @Test
    void delete_shouldDeleteWhenExists() {
        // Arrange
        SupplierImage img = SupplierImage.create(supplierId, 0, false, "image/jpeg", "/s.jpg", "s.jpg", 100L);
        when(supplierImageRepository.findById(imageId)).thenReturn(Mono.just(img));
        when(supplierImageRepository.deleteById(imageId)).thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(useCase.delete(imageId))
            .verifyComplete();
    }

    @Test
    void delete_shouldThrowNotFoundWhenMissing() {
        // Arrange
        when(supplierImageRepository.findById(imageId)).thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(useCase.delete(imageId))
            .expectError(NotFoundException.class)
            .verify();
    }

    @Test
    void setPrimary_shouldUpdatePrimaryFlag() {
        // Arrange
        SupplierImage target = new SupplierImage(imageId, supplierId, 0, false, "image/jpeg", "/a.jpg", "a.jpg", 100L, Instant.now());
        SupplierImage other  = new SupplierImage(UUID.randomUUID(), supplierId, 1, true, "image/jpeg", "/b.jpg", "b.jpg", 200L, Instant.now());

        when(supplierImageRepository.findById(imageId)).thenReturn(Mono.just(target));
        when(supplierImageRepository.findBySupplierId(supplierId)).thenReturn(Flux.just(target, other));
        when(supplierImageRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        // Act & Assert
        StepVerifier.create(useCase.setPrimary(imageId))
            .assertNext(img -> {
                assert img.id().equals(imageId);
                assert img.isPrimary();
            })
            .verifyComplete();
    }
}
