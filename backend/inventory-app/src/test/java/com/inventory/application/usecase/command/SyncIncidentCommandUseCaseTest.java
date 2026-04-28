package com.inventory.application.usecase.command;

import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.SyncIncident;
import com.inventory.domain.ports.in.SyncIncidentCommandPort;
import com.inventory.domain.ports.out.SyncIncidentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.junit.jupiter.api.Assertions;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SyncIncidentCommandUseCaseTest {

    @Mock
    private SyncIncidentRepository syncIncidentRepository;

    private SyncIncidentCommandUseCase useCase;

    private final UUID incidentId = UUID.randomUUID();
    private final UUID userId     = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        useCase = new SyncIncidentCommandUseCase(syncIncidentRepository);
    }

    @Test
    void report_shouldCreateNewIncident() {
        // Arrange
        var command = new SyncIncidentCommandPort.ReportCommand(
            "device-1", "op-abc", "Product", "prod-1",
            SyncIncident.IncidentType.STOCK_CONFLICT, "{}", "{}", userId
        );
        SyncIncident incident = SyncIncident.create(
            "device-1", "op-abc", "Product", "prod-1",
            SyncIncident.IncidentType.STOCK_CONFLICT, "{}", "{}", userId
        );
        when(syncIncidentRepository.existsByOperationId("op-abc")).thenReturn(Mono.just(false));
        when(syncIncidentRepository.save(any())).thenReturn(Mono.just(incident));

        // Act & Assert
        StepVerifier.create(useCase.report(command))
            .assertNext(i -> {
                Assertions.assertEquals("op-abc", i.getOperationId());
                Assertions.assertEquals(SyncIncident.IncidentStatus.PENDING, i.getStatus());
            })
            .verifyComplete();
    }

    @Test
    void resolve_shouldMarkResolved() {
        // Arrange
        SyncIncident incident = SyncIncident.create(
            "device-1", "op-xyz", "Sale", "sale-1",
            SyncIncident.IncidentType.VERSION_MISMATCH, null, null, userId
        );
        when(syncIncidentRepository.findById(incidentId)).thenReturn(Mono.just(incident));
        when(syncIncidentRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        // Act & Assert
        StepVerifier.create(useCase.resolve(incidentId, "accepted server version"))
            .assertNext(i -> Assertions.assertEquals(SyncIncident.IncidentStatus.RESOLVED, i.getStatus()))
            .verifyComplete();
    }

    @Test
    void resolve_shouldThrowNotFoundWhenMissing() {
        // Arrange
        when(syncIncidentRepository.findById(incidentId)).thenReturn(Mono.empty());

        // Act & Assert
        StepVerifier.create(useCase.resolve(incidentId, "any"))
            .expectError(NotFoundException.class)
            .verify();
    }

    @Test
    void ignore_shouldMarkIgnored() {
        // Arrange
        SyncIncident incident = SyncIncident.create(
            "device-2", "op-zzz", "Category", "cat-1",
            SyncIncident.IncidentType.CHECKSUM_ERROR, "{}", "{}", userId
        );
        when(syncIncidentRepository.findById(incidentId)).thenReturn(Mono.just(incident));
        when(syncIncidentRepository.save(any())).thenAnswer(inv -> Mono.just(inv.getArgument(0)));

        // Act & Assert
        StepVerifier.create(useCase.ignore(incidentId))
            .assertNext(i -> Assertions.assertEquals(SyncIncident.IncidentStatus.IGNORED, i.getStatus()))
            .verifyComplete();
    }
}
