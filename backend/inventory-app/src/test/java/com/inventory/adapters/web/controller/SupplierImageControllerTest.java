package com.inventory.adapters.web.controller;

import com.inventory.application.dto.SupplierImageDto;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.domain.model.SupplierImage;
import com.inventory.domain.ports.in.SupplierImageCommandPort;
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

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@WebFluxTest(SupplierImageController.class)
@ContextConfiguration(classes = {SupplierImageController.class, TestSecurityConfig.class})
@DisplayName("SupplierImageController REST")
class SupplierImageControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockBean
    private SupplierImageCommandPort commandPort;

    @MockBean
    private SupplementaryApplicationMapper mapper;

    private final UUID supplierId = UUID.randomUUID();
    private final UUID imageId    = UUID.randomUUID();

    private SupplierImage buildImage(UUID id, boolean primary, int sortOrder, String contentType) {
        return new SupplierImage(
            id, supplierId, sortOrder, primary,
            contentType, "/uploads/" + id + ".jpg", "logo.jpg",
            4096L, Instant.now()
        );
    }

    private SupplierImageDto buildDto(SupplierImage img) {
        return new SupplierImageDto(
            img.id(), img.supplierId(), img.sortOrder(), img.isPrimary(),
            img.contentType(), img.filePath(), img.originalFilename(),
            img.sizeBytes(), img.createdAt()
        );
    }

    // ─── seguridad ───────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/v1/suppliers/{id}/images devuelve 401 sin autenticación")
    void listImages_returns401WhenUnauthenticated() {
        webTestClient.get()
            .uri("/api/v1/suppliers/{id}/images", supplierId)
            .exchange()
            .expectStatus().isUnauthorized();
    }

    @Test
    @WithMockUser(roles = "SELLER")
    @DisplayName("POST /api/v1/suppliers/{id}/images devuelve 403 con rol SELLER")
    void upload_returns403WhenSeller() {
        webTestClient.post()
            .uri("/api/v1/suppliers/{id}/images", supplierId)
            .bodyValue("{\"isPrimary\":false,\"contentType\":\"image/jpeg\"," +
                       "\"filePath\":\"/uploads/x.jpg\",\"originalFilename\":\"x.jpg\"," +
                       "\"sizeBytes\":512,\"sortOrder\":0}")
            .header("Content-Type", "application/json")
            .exchange()
            .expectStatus().isForbidden();
    }

    // ─── listado ─────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "SELLER")
    @DisplayName("GET lista imágenes de un proveedor — devuelve todas con metadatos")
    void listImages_returns200WithAllImages() {
        SupplierImage img1 = buildImage(UUID.randomUUID(), true, 0, "image/jpeg");
        SupplierImage img2 = buildImage(UUID.randomUUID(), false, 1, "image/png");
        SupplierImageDto dto1 = buildDto(img1);
        SupplierImageDto dto2 = buildDto(img2);

        when(commandPort.listBySupplierId(supplierId)).thenReturn(Flux.just(img1, img2));
        when(mapper.toDto(img1)).thenReturn(dto1);
        when(mapper.toDto(img2)).thenReturn(dto2);

        webTestClient.get()
            .uri("/api/v1/suppliers/{id}/images", supplierId)
            .exchange()
            .expectStatus().isOk()
            .expectBodyList(SupplierImageDto.class)
            .hasSize(2)
            .value(list -> {
                assert list.stream().anyMatch(SupplierImageDto::isPrimary)
                    : "debe haber exactamente una imagen primary";
                assert list.stream().map(SupplierImageDto::contentType).distinct().count() == 2
                    : "debe haber imágenes con contentType distintos";
            });
    }

    // ─── upload ──────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST upload imagen proveedor — persiste y devuelve metadatos completos")
    void upload_returns201WithImageMetadata() {
        SupplierImage saved = buildImage(imageId, false, 0, "image/jpeg");
        SupplierImageDto dto = buildDto(saved);

        when(commandPort.upload(any())).thenReturn(Mono.just(saved));
        when(mapper.toDto(saved)).thenReturn(dto);

        webTestClient.post()
            .uri("/api/v1/suppliers/{id}/images", supplierId)
            .bodyValue("""
                {
                  "isPrimary": false,
                  "contentType": "image/jpeg",
                  "filePath": "/uploads/%s.jpg",
                  "originalFilename": "logo.jpg",
                  "sizeBytes": 4096,
                  "sortOrder": 0
                }
                """.formatted(imageId))
            .header("Content-Type", "application/json")
            .exchange()
            .expectStatus().isCreated()
            .expectBody(SupplierImageDto.class)
            .value(result -> {
                assert result.supplierId().equals(supplierId) : "supplierId debe coincidir";
                assert result.contentType().equals("image/jpeg") : "contentType debe ser image/jpeg";
                assert result.sizeBytes() == 4096L : "sizeBytes debe ser 4096";
                assert !result.isPrimary() : "no debe ser primary";
            });
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    @DisplayName("POST upload imagen proveedor con flag primary — queda marcada como primary")
    void upload_withPrimaryFlag_setsPrimaryTrue() {
        SupplierImage saved = buildImage(imageId, true, 0, "image/png");
        SupplierImageDto dto = buildDto(saved);

        when(commandPort.upload(any())).thenReturn(Mono.just(saved));
        when(mapper.toDto(saved)).thenReturn(dto);

        webTestClient.post()
            .uri("/api/v1/suppliers/{id}/images", supplierId)
            .bodyValue("""
                {
                  "isPrimary": true,
                  "contentType": "image/png",
                  "filePath": "/uploads/logo-primary.png",
                  "originalFilename": "logo-primary.png",
                  "sizeBytes": 8192,
                  "sortOrder": 0
                }
                """)
            .header("Content-Type", "application/json")
            .exchange()
            .expectStatus().isCreated()
            .expectBody(SupplierImageDto.class)
            .value(result -> { assertTrue(result.isPrimary(), "imagen debe estar marcada como primary"); });
    }

    // ─── setPrimary ───────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("POST /{imageId}/primary — promueve imagen de proveedor a primary")
    void setPrimary_returns200AndPrimaryTrue() {
        SupplierImage promoted = buildImage(imageId, true, 0, "image/jpeg");
        SupplierImageDto dto = buildDto(promoted);

        when(commandPort.setPrimary(imageId)).thenReturn(Mono.just(promoted));
        when(mapper.toDto(promoted)).thenReturn(dto);

        webTestClient.post()
            .uri("/api/v1/suppliers/{sid}/images/{iid}/primary", supplierId, imageId)
            .exchange()
            .expectStatus().isOk()
            .expectBody(SupplierImageDto.class)
            .value(r -> { assertTrue(r.isPrimary(), "imagen promovida debe ser primary"); });
    }

    // ─── delete ──────────────────────────────────────────────────

    @Test
    @WithMockUser(roles = "ADMIN")
    @DisplayName("DELETE /{imageId} — elimina imagen de proveedor y devuelve 204")
    void delete_returns204() {
        when(commandPort.delete(imageId)).thenReturn(Mono.empty());

        webTestClient.delete()
            .uri("/api/v1/suppliers/{sid}/images/{iid}", supplierId, imageId)
            .exchange()
            .expectStatus().isNoContent();
    }

    @Test
    @WithMockUser(roles = "SELLER")
    @DisplayName("DELETE /{imageId} — devuelve 403 con rol SELLER")
    void delete_returns403WhenSeller() {
        webTestClient.delete()
            .uri("/api/v1/suppliers/{sid}/images/{iid}", supplierId, imageId)
            .exchange()
            .expectStatus().isForbidden();
    }
}
