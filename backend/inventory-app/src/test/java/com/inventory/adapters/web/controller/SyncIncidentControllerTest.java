package com.inventory.adapters.web.controller;

import com.inventory.application.dto.SyncIncidentDto;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.model.SyncIncident;
import com.inventory.domain.ports.in.SyncIncidentCommandPort;
import com.inventory.domain.ports.in.SyncIncidentQueryPort;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@WebFluxTest(SyncIncidentController.class)
@ContextConfiguration(classes = {SyncIncidentController.class, TestSecurityConfig.class})
@DisplayName("SyncIncidentController REST")
class SyncIncidentControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private SyncIncidentCommandPort commandPort;

    @MockBean
    private SyncIncidentQueryPort queryPort;

    @MockBean
    private SupplementaryApplicationMapper mapper;

    private final UUID incidentId = UUID.randomUUID();

    private SyncIncidentDto sampleDto() {
        return new SyncIncidentDto(
            incidentId, "device-001", "op-001",
            "Product", UUID.randomUUID().toString(),
            "STOCK_CONFLICT", "PENDING",
            "{}", "{}", null,
            UUID.randomUUID(), Instant.now(), null
        );
    }

    @Test
    @DisplayName("GET /api/v1/sync/incidents devuelve 401 sin autenticación")
    void list_returns401WhenUnauthenticated() {
        webTestClient.get()
            .uri("/api/v1/sync/incidents")
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(roles = "SELLER")
    @DisplayName("GET /api/v1/sync/incidents devuelve 403 con rol SELLER")
    void list_returns403WhenSeller() {
        webTestClient.get()
            .uri("/api/v1/sync/incidents")
            .exchange()
            .expectStatus().isForbidden();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/v1/sync/incidents devuelve lista con rol ADMIN")
    void list_returns200WhenAdmin() {
        SyncIncidentDto dto = sampleDto();
        when(queryPort.listPending()).thenReturn(Flux.just(buildIncident()));
        when(mapper.toDto(any(SyncIncident.class))).thenReturn(dto);

        webTestClient.get()
            .uri("/api/v1/sync/incidents")
            .exchange()
            .expectStatus().isOk()
            .expectBodyList(SyncIncidentDto.class).hasSize(1);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/v1/sync/incidents?deviceId= filtra por dispositivo")
    void list_filtersByDeviceId() {
        SyncIncidentDto dto = sampleDto();
        when(queryPort.listByDeviceId("device-001")).thenReturn(Flux.just(buildIncident()));
        when(mapper.toDto(any(SyncIncident.class))).thenReturn(dto);

        webTestClient.get()
            .uri("/api/v1/sync/incidents?deviceId=device-001")
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    @WithMockUser(roles = "SELLER")
    @DisplayName("POST /api/v1/sync/incidents reporta incidencia autenticado")
    void report_returns201WhenAuthenticated() {
        SyncIncidentDto dto = sampleDto();
        when(commandPort.report(any())).thenReturn(Mono.just(buildIncident()));
        when(mapper.toDto(any(SyncIncident.class))).thenReturn(dto);

        webTestClient.post()
            .uri("/api/v1/sync/incidents")
            .bodyValue("""
                {
                  "deviceId":"device-001","operationId":"op-001",
                  "entityType":"Product","entityId":"abc-123",
                  "incidentType":"STOCK_CONFLICT",
                  "myPayload":"{}","serverPayload":"{}"
                }
                """)
            .header("Content-Type", "application/json")
            .exchange()
            .expectStatus().isCreated();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/v1/sync/incidents/{id}/resolve resuelve incidencia")
    void resolve_returns200WhenAdmin() {
        SyncIncidentDto dto = sampleDto();
        when(commandPort.resolve(eq(incidentId), any())).thenReturn(Mono.just(buildIncident()));
        when(mapper.toDto(any(SyncIncident.class))).thenReturn(dto);

        webTestClient.post()
            .uri("/api/v1/sync/incidents/{id}/resolve", incidentId)
            .bodyValue("""
                {"resolution":"USE_SERVER"}
                """)
            .header("Content-Type", "application/json")
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /api/v1/sync/incidents/{id}/ignore ignora incidencia")
    void ignore_returns200WhenAdmin() {
        SyncIncidentDto dto = sampleDto();
        when(commandPort.ignore(incidentId)).thenReturn(Mono.just(buildIncident()));
        when(mapper.toDto(any(SyncIncident.class))).thenReturn(dto);

        webTestClient.post()
            .uri("/api/v1/sync/incidents/{id}/ignore", incidentId)
            .exchange()
            .expectStatus().isOk();
    }

    private SyncIncident buildIncident() {
        return new SyncIncident(
            incidentId, "device-001", "op-001",
            "Product", UUID.randomUUID().toString(),
            SyncIncident.IncidentType.STOCK_CONFLICT,
            SyncIncident.IncidentStatus.PENDING,
            "{}", "{}", null,
            UUID.randomUUID(), Instant.now(), null
        );
    }
}
