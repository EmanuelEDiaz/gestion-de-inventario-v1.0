package com.inventory.application.usecase.command;

import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.SupplierSocialLink;
import com.inventory.domain.ports.in.SupplierSocialLinkCommandPort;
import com.inventory.domain.ports.out.SupplierSocialLinkRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SupplierSocialLinkCommandUseCaseTest {

    @Mock
    private SupplierSocialLinkRepository supplierSocialLinkRepository;

    private SupplierSocialLinkCommandUseCase useCase;

    private final UUID supplierId = UUID.randomUUID();
    private final UUID linkId     = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        useCase = new SupplierSocialLinkCommandUseCase(supplierSocialLinkRepository);
    }

    @Test
    void add_shouldSaveAndReturnLink() {
        // Arrange
        var command = new SupplierSocialLinkCommandPort.AddCommand(
            supplierId, SupplierSocialLink.Platform.INSTAGRAM, "https://instagram.com/acme", "Instagram", 0
        );
        SupplierSocialLink saved = SupplierSocialLink.create(supplierId, SupplierSocialLink.Platform.INSTAGRAM,
            "https://instagram.com/acme", "Instagram", 0);
        when(supplierSocialLinkRepository.save(any())).thenReturn(Mono.just(saved));

        // Act & Assert
        StepVerifier.create(useCase.add(command))
            .assertNext(link -> {
                assert link.supplierId().equals(supplierId);
                assert link.platform() == SupplierSocialLink.Platform.INSTAGRAM;
            })
            .verifyComplete();
    }

    @Test
    void delete_shouldDeleteWhenExists() {
        // Arrange
        SupplierSocialLink link = SupplierSocialLink.create(supplierId, SupplierSocialLink.Platform.WEBSITE, "url", "lbl", 1);
        when(supplierSocialLinkRepository.findById(linkId)).thenReturn(Mono.just(link));
        when(supplierSocialLinkRepository.deleteById(linkId)).thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(useCase.delete(linkId))
            .verifyComplete();
    }

    @Test
    void delete_shouldThrowNotFoundWhenMissing() {
        // Arrange
        when(supplierSocialLinkRepository.findById(linkId)).thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(useCase.delete(linkId))
            .expectError(NotFoundException.class)
            .verify();
    }
}
