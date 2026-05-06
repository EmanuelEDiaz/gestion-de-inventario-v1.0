package com.inventory.adapters.web.controller;

import com.inventory.application.dto.NotificationDto;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.model.Notification;
import com.inventory.domain.ports.in.NotificationCommandPort;
import com.inventory.domain.ports.in.NotificationQueryPort;
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

@WebFluxTest(NotificationController.class)
@ContextConfiguration(classes = {NotificationController.class, TestSecurityConfig.class})
@DisplayName("NotificationController REST")
class NotificationControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private NotificationCommandPort commandPort;

    @MockBean
    private NotificationQueryPort queryPort;

    @MockBean
    private SupplementaryApplicationMapper mapper;

    @MockBean
    private com.inventory.application.service.NotificationPreferencesService preferencesService;

    @MockBean
    private com.inventory.application.service.NotificationSchedulesService schedulesService;

    private final UUID notifId = UUID.randomUUID();
    private final String testUserId = "550e8400-e29b-41d4-a716-446655440000";

    private NotificationDto sampleDto() {
        return new NotificationDto(
            notifId, "SYSTEM_AUTO", "LOW_STOCK", "Stock bajo",
            "Producto X tiene stock bajo", "ALL", null, null,
            "Product", UUID.randomUUID(), Instant.now(), false
        );
    }

    @Test
    @DisplayName("GET /api/v1/notifications devuelve 401 sin autenticación")
    void list_returns401WhenUnauthenticated() {
        webTestClient.get()
            .uri("/api/v1/notifications")
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000", roles = "SELLER")
    @DisplayName("GET /api/v1/notifications devuelve notificaciones al usuario autenticado")
    void list_returns200WhenAuthenticated() {
        NotificationDto dto = sampleDto();
        Notification notification = buildNotification();
        when(queryPort.listForUser(any(), eq(false))).thenReturn(Flux.just(notification));
        when(mapper.toDto(any(Notification.class), eq(false))).thenReturn(dto);

        webTestClient.get()
            .uri("/api/v1/notifications")
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000", roles = "SELLER")
    @DisplayName("GET /api/v1/notifications/unread-count devuelve conteo")
    void unreadCount_returns200() {
        when(queryPort.getUnreadCount(any())).thenReturn(Mono.just(5L));

        webTestClient.get()
            .uri("/api/v1/notifications/unread-count")
            .exchange()
            .expectStatus().isOk()
            .expectBody(Long.class).isEqualTo(5L);
    }

    @Test
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000", roles = "SELLER")
    @DisplayName("POST /api/v1/notifications devuelve 403 con rol SELLER")
    void create_returns403WhenSeller() {
        webTestClient.post()
            .uri("/api/v1/notifications")
            .bodyValue("""
                {"title":"Test","body":"Body","category":"LOW_STOCK","targetType":"ALL"}
                """)
            .header("Content-Type", "application/json")
            .exchange()
            .expectStatus().isForbidden();
    }

    @Test
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000", roles = "ADMIN")
    @DisplayName("POST /api/v1/notifications crea notificación con rol ADMIN")
    void create_returns201WhenAdmin() {
        NotificationDto dto = sampleDto();
        when(commandPort.create(any())).thenReturn(Mono.just(buildNotification()));
        when(mapper.toDto(any(Notification.class), eq(false))).thenReturn(dto);

        webTestClient.post()
            .uri("/api/v1/notifications")
            .bodyValue("""
                {"title":"Test","body":"Body","category":"LOW_STOCK","targetType":"ALL"}
                """)
            .header("Content-Type", "application/json")
            .exchange()
            .expectStatus().isCreated();
    }

    @Test
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000", roles = "SELLER")
    @DisplayName("POST /api/v1/notifications/{id}/read marca como leída")
    void markRead_returns200() {
        when(commandPort.markRead(eq(notifId), any())).thenReturn(Mono.empty());

        webTestClient.post()
            .uri("/api/v1/notifications/{id}/read", notifId)
            .exchange()
            .expectStatus().isOk();
    }

    @Test
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000", roles = "SELLER")
    @DisplayName("POST /api/v1/notifications/read-all marca todas como leídas")
    void markAllRead_returns200() {
        when(commandPort.markAllRead(any())).thenReturn(Mono.empty());

        webTestClient.post()
            .uri("/api/v1/notifications/read-all")
            .exchange()
            .expectStatus().isOk();
    }

    private Notification buildNotification() {
        return new Notification(
            notifId,
            Notification.NotificationSource.SYSTEM,
            Notification.NotificationCategory.LOW_STOCK,
            Notification.NotificationPriority.MEDIUM,
            "Stock bajo",
            "Producto X tiene stock bajo",
            null,
            java.util.List.of(),
            "SSE",
            Notification.TargetType.ALL,
            null,
            null,
            "Product",
            UUID.randomUUID(),
            Instant.now()
        );
    }
}
