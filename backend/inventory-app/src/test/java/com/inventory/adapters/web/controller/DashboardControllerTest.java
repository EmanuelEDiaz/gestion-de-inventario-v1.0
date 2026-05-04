package com.inventory.adapters.web.controller;

import com.inventory.domain.ports.in.DashboardQueryPort;
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

import java.math.BigDecimal;
import java.util.UUID;

import static org.mockito.Mockito.when;

/**
 * Tests de slice (@WebFluxTest) para DashboardController.
 * Verifica rutas, serialización JSON y seguridad (RBAC).
 */
@WebFluxTest(DashboardController.class)
@ContextConfiguration(classes = {DashboardController.class, TestSecurityConfig.class})
@DisplayName("DashboardController REST")
class DashboardControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private DashboardQueryPort dashboardQueryPort;

    @Test
    @DisplayName("GET /api/v1/dashboard/stats devuelve 401 sin autenticación")
    void getStats_returns401WhenUnauthenticated() {
        webTestClient.get()
            .uri("/api/v1/dashboard/stats")
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/v1/dashboard/stats devuelve 200 con rol ADMIN")
    void getStats_returns200WhenAdmin() {
        DashboardQueryPort.DashboardStats stats = new DashboardQueryPort.DashboardStats(
            10L, 2L, 50L, 5L, 3L, 1L,
            BigDecimal.valueOf(500), BigDecimal.valueOf(2000),
            8L, BigDecimal.valueOf(1500)
        );

        when(dashboardQueryPort.getStats()).thenReturn(Mono.just(stats));

        webTestClient.get()
            .uri("/api/v1/dashboard/stats")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.totalProducts").isEqualTo(10)
            .jsonPath("$.totalWarehouses").isEqualTo(2)
            .jsonPath("$.lowStockCount").isEqualTo(3)
            .jsonPath("$.salesToday").isEqualTo(500);
    }

    @Test
    @WithMockUser(roles = "SELLER")
    @DisplayName("GET /api/v1/dashboard/stats devuelve 200 con rol SELLER")
    void getStats_returns200WhenSeller() {
        when(dashboardQueryPort.getStats()).thenReturn(Mono.just(
            new DashboardQueryPort.DashboardStats(0L, 0L, 0L, 0L, 0L, 0L,
                BigDecimal.ZERO, BigDecimal.ZERO, 0L, BigDecimal.ZERO)
        ));

        webTestClient.get()
            .uri("/api/v1/dashboard/stats")
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET /api/v1/dashboard/low-stock devuelve lista de items")
    void getLowStockItems_returnsItems() {
        DashboardQueryPort.LowStockItem item = new DashboardQueryPort.LowStockItem(
            UUID.randomUUID(), "Producto A", "SKU-001",
            UUID.randomUUID(), "Almacén Central",
            BigDecimal.valueOf(3), BigDecimal.valueOf(10)
        );

        when(dashboardQueryPort.getLowStockItems()).thenReturn(Flux.just(item));

        webTestClient.get()
            .uri("/api/v1/dashboard/low-stock")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$[0].productName").isEqualTo("Producto A")
            .jsonPath("$[0].productSku").isEqualTo("SKU-001")
            .jsonPath("$[0].onHand").isEqualTo(3);
    }

    @Test
    @WithMockUser(roles = "SELLER")
    @DisplayName("GET /api/v1/dashboard/low-stock devuelve 403 con rol SELLER")
    void getLowStockItems_returns403WhenSeller() {
        webTestClient.get()
            .uri("/api/v1/dashboard/low-stock")
            .exchange()
            .expectStatus().isForbidden();
    }
}
