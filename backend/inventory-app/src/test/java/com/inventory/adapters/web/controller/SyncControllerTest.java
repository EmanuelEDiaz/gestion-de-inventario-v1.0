package com.inventory.adapters.web.controller;

import com.inventory.adapters.persistence.repository.R2dbcSyncLogRepository;
import com.inventory.application.dto.SyncEntryDto;
import com.inventory.application.dto.SyncPullResponseDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

/**
 * Tests de slice para SyncController.
 */
@WebFluxTest(SyncController.class)
@ContextConfiguration(classes = {SyncController.class, TestSecurityConfig.class})
@DisplayName("SyncController REST")
class SyncControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private R2dbcSyncLogRepository syncLogRepo;

    @Test
    @DisplayName("GET /sync/pull devuelve 401 sin autenticación")
    void pull_returns401WhenUnauthenticated() {
        webTestClient.get()
            .uri("/api/v1/sync/pull")
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser
    @DisplayName("GET /sync/pull devuelve respuesta paginada vacía")
    void pull_returnsEmptyResponseWhenNoEntries() {
        when(syncLogRepo.findAfterCursor(anyLong(), anyInt())).thenReturn(
            reactor.core.publisher.Flux.empty()
        );

        webTestClient.get()
            .uri("/api/v1/sync/pull?cursor=0")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.hasMore").isEqualTo(false)
            .jsonPath("$.nextCursor").isEqualTo(0)
            .jsonPath("$.entries").isArray();
    }

    @Test
    @WithMockUser
    @DisplayName("GET /sync/pull usa cursor=0 por defecto")
    void pull_usesDefaultCursorZero() {
        when(syncLogRepo.findAfterCursor(anyLong(), anyInt())).thenReturn(
            reactor.core.publisher.Flux.empty()
        );

        webTestClient.get()
            .uri("/api/v1/sync/pull")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.nextCursor").isEqualTo(0);
    }
}
