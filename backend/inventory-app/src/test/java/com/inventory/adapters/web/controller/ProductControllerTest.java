package com.inventory.adapters.web.controller;

import com.inventory.adapters.web.dto.ProductResponse;
import com.inventory.adapters.web.mapper.CatalogWebMapper;
import com.inventory.domain.model.product.Product;
import com.inventory.domain.ports.in.ProductCommandPort;
import com.inventory.domain.ports.in.ProductFilter;
import com.inventory.domain.ports.in.ProductQueryPort;
import com.inventory.domain.ports.out.CategoryRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.WebFluxTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockUser;

@WebFluxTest(ProductController.class)
@Import(GlobalExceptionHandler.class)
@DisplayName("ProductController")
class ProductControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @MockitoBean
    private ProductQueryPort productQuery;

    @MockitoBean
    private ProductCommandPort productCommand;

    @MockitoBean
    private CategoryRepository categoryRepository;

    @MockitoBean
    private CatalogWebMapper mapper;

    private final UUID productId = UUID.randomUUID();

    private Product createTestProduct() {
        return new Product(
            productId, "SKU-001", null, "Test Product", null,
            null, Product.ProductStatus.ACTIVE, Product.CostMethod.INHERIT,
            BigDecimal.TEN, BigDecimal.valueOf(20), null, "CUP", BigDecimal.ZERO, "UNIT",
            Instant.now(), Instant.now(), 0, null
        );
    }

    private ProductResponse createTestResponse() {
        return new ProductResponse(
            productId, "SKU-001", null, "Test Product", null,
            null, null, "ACTIVE", "INHERIT",
            BigDecimal.TEN, BigDecimal.valueOf(20), null, "CUP", BigDecimal.ZERO, "UNIT",
            Instant.now(), Instant.now(), 0, null
        );
    }

    @Test
    @DisplayName("GET /api/v1/products returns empty list when no products")
    void getAll_emptyList() {
        when(productQuery.findAllWithCursor(isNull(), any(ProductFilter.class), eq(false)))
            .thenReturn(Flux.empty());

        webTestClient
            .mutateWith(mockUser())
            .get().uri("/api/v1/products")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.items").isArray()
            .jsonPath("$.items.length()").isEqualTo(0);
    }

    @Test
    @DisplayName("GET /api/v1/products/{id} returns product when found")
    void getById_found() {
        var product = createTestProduct();
        var response = createTestResponse();

        when(productQuery.findById(productId)).thenReturn(Mono.just(product));
        when(mapper.toResponse(product, null)).thenReturn(response);

        webTestClient
            .mutateWith(mockUser())
            .get().uri("/api/v1/products/{id}", productId)
            .exchange()
            .expectStatus().isOk()
            .expectBody(ProductResponse.class)
            .isEqualTo(response);
    }

    @Test
    @DisplayName("GET /api/v1/products/{id} returns 404 when not found")
    void getById_notFound() {
        when(productQuery.findById(productId)).thenReturn(Mono.empty());

        webTestClient
            .mutateWith(mockUser())
            .get().uri("/api/v1/products/{id}", productId)
            .exchange()
            .expectStatus().isNotFound();
    }

    @Test
    @DisplayName("POST /api/v1/products creates product successfully (201)")
    void create_success() {
        var product = createTestProduct();
        var response = createTestResponse();

        when(productCommand.create(any(ProductCommandPort.CreateProductCommand.class)))
            .thenReturn(Mono.just(product));
        when(mapper.toResponse(product, null)).thenReturn(response);

        webTestClient
            .mutateWith(mockUser())
            .mutateWith(csrf())
            .post().uri("/api/v1/products")
            .bodyValue("""
                {
                    "name": "Test Product",
                    "sku": "SKU-001",
                    "salePrice": 20.0
                }
                """)
            .exchange()
            .expectStatus().isCreated()
            .expectBody(ProductResponse.class)
            .isEqualTo(response);
    }

    @Test
    @DisplayName("POST /api/v1/products returns 400 on validation error")
    void create_validationError() {
        webTestClient
            .mutateWith(mockUser())
            .mutateWith(csrf())
            .post().uri("/api/v1/products")
            .bodyValue("""
                {
                    "sku": "SKU-001",
                    "salePrice": 20.0
                }
                """)
            .exchange()
            .expectStatus().isBadRequest();
    }

    @Test
    @DisplayName("PUT /api/v1/products/{id} updates product successfully")
    void update_success() {
        var product = createTestProduct();
        var response = createTestResponse();

        when(productCommand.update(eq(productId), any(ProductCommandPort.UpdateProductCommand.class)))
            .thenReturn(Mono.just(product));
        when(mapper.toResponse(product, null)).thenReturn(response);

        webTestClient
            .mutateWith(mockUser())
            .mutateWith(csrf())
            .put().uri("/api/v1/products/{id}", productId)
            .bodyValue("""
                {
                    "name": "Updated Product",
                    "sku": "SKU-001",
                    "salePrice": 25.0
                }
                """)
            .exchange()
            .expectStatus().isOk()
            .expectBody(ProductResponse.class)
            .isEqualTo(response);
    }

    @Test
    @DisplayName("DELETE /api/v1/products/{id} deletes successfully (204)")
    void delete_success() {
        when(productCommand.delete(productId)).thenReturn(Mono.empty());

        webTestClient
            .mutateWith(mockUser())
            .mutateWith(csrf())
            .delete().uri("/api/v1/products/{id}", productId)
            .exchange()
            .expectStatus().isNoContent();
    }

    @Test
    @DisplayName("POST /api/v1/products/{id}/archive archives product")
    void archive_success() {
        var archivedProduct = new Product(
            productId, "SKU-001", null, "Test Product", null,
            null, Product.ProductStatus.ARCHIVED, Product.CostMethod.INHERIT,
            BigDecimal.TEN, BigDecimal.valueOf(20), null, "CUP", BigDecimal.ZERO, "UNIT",
            Instant.now(), Instant.now(), 0, null
        );
        var archivedResponse = new ProductResponse(
            productId, "SKU-001", null, "Test Product", null,
            null, null, "ARCHIVED", "INHERIT",
            BigDecimal.TEN, BigDecimal.valueOf(20), null, "CUP", BigDecimal.ZERO, "UNIT",
            Instant.now(), Instant.now(), 0, null
        );

        when(productCommand.archive(productId)).thenReturn(Mono.just(archivedProduct));
        when(mapper.toResponse(archivedProduct, null)).thenReturn(archivedResponse);

        webTestClient
            .mutateWith(mockUser())
            .mutateWith(csrf())
            .post().uri("/api/v1/products/{id}/archive", productId)
            .exchange()
            .expectStatus().isOk()
            .expectBody(ProductResponse.class)
            .isEqualTo(archivedResponse);
    }

    @Test
    @DisplayName("POST /api/v1/products/{id}/activate activates product")
    void activate_success() {
        var activatedProduct = new Product(
            productId, "SKU-001", null, "Test Product", null,
            null, Product.ProductStatus.ACTIVE, Product.CostMethod.INHERIT,
            BigDecimal.TEN, BigDecimal.valueOf(20), null, "CUP", BigDecimal.ZERO, "UNIT",
            Instant.now(), Instant.now(), 0, null
        );
        var activatedResponse = new ProductResponse(
            productId, "SKU-001", null, "Test Product", null,
            null, null, "ACTIVE", "INHERIT",
            BigDecimal.TEN, BigDecimal.valueOf(20), null, "CUP", BigDecimal.ZERO, "UNIT",
            Instant.now(), Instant.now(), 0, null
        );

        when(productCommand.activate(productId)).thenReturn(Mono.just(activatedProduct));
        when(mapper.toResponse(activatedProduct, null)).thenReturn(activatedResponse);

        webTestClient
            .mutateWith(mockUser())
            .mutateWith(csrf())
            .post().uri("/api/v1/products/{id}/activate", productId)
            .exchange()
            .expectStatus().isOk()
            .expectBody(ProductResponse.class)
            .isEqualTo(activatedResponse);
    }
}
