package com.inventory.adapters.web.controller;

import com.inventory.application.dto.CustomerImageDto;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.model.CustomerImage;
import com.inventory.domain.ports.in.CustomerImageCommandPort;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@WebFluxTest(CustomerImageController.class)
@ContextConfiguration(classes = {CustomerImageController.class, TestSecurityConfig.class})
@DisplayName("CustomerImageController REST")
class CustomerImageControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private CustomerImageCommandPort commandPort;

    @MockBean
    private SupplementaryApplicationMapper mapper;

    private final UUID customerId = UUID.randomUUID();
    private final UUID imageId    = UUID.randomUUID();

    private CustomerImage buildImage(UUID id, boolean primary, int sortOrder) {
        return new CustomerImage(
            id, customerId, sortOrder, primary,
            "image/png", "/uploads/" + id + ".png", "foto.png",
            2048L, Instant.now()
        );
    }

    private CustomerImageDto buildDto(CustomerImage img) {
        return new CustomerImageDto(
            img.id(), img.customerId(), img.sortOrder(), img.isPrimary(),
            img.contentType(), img.filePath(), img.originalFilename(),
            img.sizeBytes(), img.createdAt()
        );
    }

    // ─── seguridad ───────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/customers/{id}/images devuelve 401 sin autenticación")
    void listImages_returns401WhenUnauthenticated() {
        webTestClient.get()
            .uri("/api/v1/customers/{id}/images", customerId)
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(roles = "SELLER")
    @DisplayName("POST /api/v1/customers/{id}/images devuelve 403 con rol SELLER")
    void upload_returns403WhenSeller() {
        webTestClient.post()
            .uri("/api/v1/customers/{id}/images", customerId)
            .bodyValue("{\"isPrimary\":false,\"contentType\":\"image/png\"," +
                       "\"filePath\":\"/uploads/x.png\",\"originalFilename\":\"x.png\"," +
                       "\"sizeBytes\":1024,\"sortOrder\":0}")
            .header("Content-Type", "application/json")
            .exchange()
            .expectStatus().isForbidden();
    }

    // ─── listado ─────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "SELLER")
    @DisplayName("GET lista imágenes de un cliente — devuelve todas con metadatos correctos")
    void listImages_returns200WithAllImages() {
        CustomerImage img1 = buildImage(UUID.randomUUID(), true, 0);
        CustomerImage img2 = buildImage(UUID.randomUUID(), false, 1);
        CustomerImageDto dto1 = buildDto(img1);
        CustomerImageDto dto2 = buildDto(img2);

        when(commandPort.listByCustomer(customerId)).thenReturn(Flux.just(img1, img2));
        when(mapper.toDto(img1)).thenReturn(dto1);
        when(mapper.toDto(img2)).thenReturn(dto2);

        webTestClient.get()
            .uri("/api/v1/customers/{id}/images", customerId)
            .exchange()
            .expectStatus().isOk()
            .expectBodyList(CustomerImageDto.class)
            .hasSize(2)
            .value(list -> {
                assertTrue(list.stream().anyMatch(CustomerImageDto::isPrimary), "debe haber una imagen primary");
                assertTrue(list.stream().anyMatch(d -> !d.isPrimary()), "debe haber una imagen no-primary");
            });
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("GET lista imágenes — devuelve lista vacía si no hay imágenes")
    void listImages_returnsEmptyListWhenNoImages() {
        when(commandPort.listByCustomer(customerId)).thenReturn(Flux.empty());

        webTestClient.get()
            .uri("/api/v1/customers/{id}/images", customerId)
            .exchange()
            .expectStatus().isOk()
            .expectBodyList(CustomerImageDto.class)
            .hasSize(0);
    }

    // ─── upload ──────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST upload imagen — persiste y devuelve metadatos completos")
    void upload_returns201WithImageMetadata() {
        CustomerImage saved = buildImage(imageId, false, 0);
        CustomerImageDto dto = buildDto(saved);

        when(commandPort.upload(any())).thenReturn(Mono.just(saved));
        when(mapper.toDto(saved)).thenReturn(dto);

        webTestClient.post()
            .uri("/api/v1/customers/{id}/images", customerId)
            .bodyValue("""
                {
                  "isPrimary": false,
                  "contentType": "image/png",
                  "filePath": "/uploads/%s.png",
                  "originalFilename": "foto.png",
                  "sizeBytes": 2048,
                  "sortOrder": 0
                }
                """.formatted(imageId))
            .header("Content-Type", "application/json")
            .exchange()
            .expectStatus().isCreated()
            .expectBody(CustomerImageDto.class)
            .value(result -> {
                assertEquals(customerId, result.customerId(), "customerId debe coincidir");
                assertEquals("image/png", result.contentType(), "contentType debe ser image/png");
                assertEquals(2048L, result.sizeBytes(), "sizeBytes debe ser 2048");
                assertFalse(result.isPrimary(), "no debe ser primary");
            });
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("POST upload imagen primary — la marca como primary correctamente")
    void upload_primaryFlag_setsPrimaryTrue() {
        CustomerImage saved = buildImage(imageId, true, 0);
        CustomerImageDto dto = buildDto(saved);

        when(commandPort.upload(any())).thenReturn(Mono.just(saved));
        when(mapper.toDto(saved)).thenReturn(dto);

        webTestClient.post()
            .uri("/api/v1/customers/{id}/images", customerId)
            .bodyValue("""
                {
                  "isPrimary": true,
                  "contentType": "image/jpeg",
                  "filePath": "/uploads/primary.jpg",
                  "originalFilename": "primary.jpg",
                  "sizeBytes": 4096,
                  "sortOrder": 0
                }
                """)
            .header("Content-Type", "application/json")
            .exchange()
            .expectStatus().isCreated()
            .expectBody(CustomerImageDto.class)
            .value(result -> { assertTrue(result.isPrimary(), "debe ser primary"); });
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST upload múltiples imágenes — cada una guarda sortOrder distinto")
    void upload_multipleImages_eachHasDifferentSortOrder() {
        CustomerImage img1 = buildImage(UUID.randomUUID(), false, 0);
        CustomerImage img2 = buildImage(UUID.randomUUID(), false, 1);
        CustomerImageDto dto1 = buildDto(img1);
        CustomerImageDto dto2 = buildDto(img2);

        // Primera imagen
        when(commandPort.upload(any())).thenReturn(Mono.just(img1));
        when(mapper.toDto(img1)).thenReturn(dto1);

        webTestClient.post()
            .uri("/api/v1/customers/{id}/images", customerId)
            .bodyValue("{\"isPrimary\":false,\"contentType\":\"image/png\"," +
                       "\"filePath\":\"/uploads/img1.png\",\"originalFilename\":\"img1.png\"," +
                       "\"sizeBytes\":1024,\"sortOrder\":0}")
            .header("Content-Type", "application/json")
            .exchange()
            .expectStatus().isCreated()
            .expectBody(CustomerImageDto.class)
            .value(r -> { assertEquals(0, r.sortOrder(), "primera imagen sortOrder=0"); });

        // Segunda imagen
        when(commandPort.upload(any())).thenReturn(Mono.just(img2));
        when(mapper.toDto(img2)).thenReturn(dto2);

        webTestClient.post()
            .uri("/api/v1/customers/{id}/images", customerId)
            .bodyValue("{\"isPrimary\":false,\"contentType\":\"image/png\"," +
                       "\"filePath\":\"/uploads/img2.png\",\"originalFilename\":\"img2.png\"," +
                       "\"sizeBytes\":2048,\"sortOrder\":1}")
            .header("Content-Type", "application/json")
            .exchange()
            .expectStatus().isCreated()
            .expectBody(CustomerImageDto.class)
            .value(r -> { assertEquals(1, r.sortOrder(), "segunda imagen sortOrder=1"); });
    }

    // ─── setPrimary ───────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /{imageId}/primary — promueve imagen a primary")
    void setPrimary_returns200AndPrimaryTrue() {
        CustomerImage promoted = buildImage(imageId, true, 0);
        CustomerImageDto dto = buildDto(promoted);

        when(commandPort.setPrimary(imageId)).thenReturn(Mono.just(promoted));
        when(mapper.toDto(promoted)).thenReturn(dto);

        webTestClient.post()
            .uri("/api/v1/customers/{cid}/images/{iid}/primary", customerId, imageId)
            .exchange()
            .expectStatus().isOk()
            .expectBody(CustomerImageDto.class)
            .value(r -> { assertTrue(r.isPrimary(), "imagen debe quedar como primary"); });
    }

    // ─── delete ──────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /{imageId} — elimina imagen y devuelve 204")
    void delete_returns204() {
        when(commandPort.delete(imageId)).thenReturn(Mono.empty());

        webTestClient.delete()
            .uri("/api/v1/customers/{cid}/images/{iid}", customerId, imageId)
            .exchange()
            .expectStatus().isNoContent();
    }

    @Test
    @WithMockUser(roles = "SELLER")
    @DisplayName("DELETE /{imageId} — devuelve 403 con rol SELLER")
    void delete_returns403WhenSeller() {
        webTestClient.delete()
            .uri("/api/v1/customers/{cid}/images/{iid}", customerId, imageId)
            .exchange()
            .expectStatus().isForbidden();
    }
}
