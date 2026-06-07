package com.inventory.application.usecase.command;

import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.errors.ConflictException;
import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.category.Category;
import com.inventory.domain.model.product.Product;
import com.inventory.application.usecase.command.product.ProductCommandUseCase;
import com.inventory.domain.ports.in.product.ProductCommandPort.CreateProductCommand;
import com.inventory.domain.ports.in.product.ProductCommandPort.UpdateProductCommand;
import com.inventory.domain.ports.out.CategoryRepository;
import com.inventory.domain.ports.out.ProductRepository;
import com.inventory.domain.ports.out.AuditLogRepository;
import com.inventory.domain.ports.out.SyncLogWriterPort;
import com.inventory.application.shared.AuditLogger;
import com.inventory.application.shared.AuditSerializer;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ProductCommandUseCase")
class ProductCommandUseCaseTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private SyncLogWriterPort syncLogWriter;

    @Mock
    private AuditSerializer auditSerializer;

    @Mock
    private AuditLogger auditLogger;

    @InjectMocks
    private ProductCommandUseCase useCase;

    private final UUID userId = UUID.randomUUID();

    @Test
    @DisplayName("create() creates product when SKU and barcode are unique")
    void create_success() {
        var command = new CreateProductCommand(
            "Test Product", "SKU-001", "BAR-001", null, null,
            BigDecimal.TEN, BigDecimal.valueOf(20), null, null, null
        );

        when(productRepository.findBySku("SKU-001")).thenReturn(Mono.empty());
        when(productRepository.findByBarcode("BAR-001")).thenReturn(Mono.empty());
        when(productRepository.save(any())).thenAnswer(i -> Mono.just(i.getArgument(0)));
        lenient().when(auditLogger.log(any(), any(), any(), any(), any(), any())).thenReturn(Mono.empty());
        lenient().when(syncLogWriter.log(any(), any(), any(), any(), any())).thenReturn(Mono.empty());
        when(auditSerializer.toJsonTruncated(any())).thenReturn("{}");

        StepVerifier.create(useCase.create(userId, command))
            .assertNext(product -> {
                assertThat(product.getId()).isNotNull();
                assertThat(product.getName()).isEqualTo("Test Product");
                assertThat(product.getSku()).isEqualTo("SKU-001");
                assertThat(product.getBarcode()).isEqualTo("BAR-001");
                assertThat(product.getStandardCost()).isEqualByComparingTo(BigDecimal.TEN);
                assertThat(product.getSalePrice()).isEqualByComparingTo(BigDecimal.valueOf(20));
                assertThat(product.getStatus()).isEqualTo(Product.ProductStatus.ACTIVE);
            })
            .verifyComplete();

        verify(productRepository).findBySku("SKU-001");
        verify(productRepository).findByBarcode("BAR-001");
        verify(productRepository).save(any());
    }

    @Test
    @DisplayName("create() throws ConflictException when SKU already exists")
    void create_throwsConflictWhenSkuExists() {
        var existingProduct = Product.create("Existing", "SKU-001", null, BigDecimal.ONE);
        var command = new CreateProductCommand(
            "Test Product", "SKU-001", "BAR-001", null, null,
            BigDecimal.TEN, BigDecimal.valueOf(20), null, null, null
        );

        when(productRepository.findBySku("SKU-001")).thenReturn(Mono.just(existingProduct));
        when(productRepository.findByBarcode(any())).thenReturn(Mono.empty());

        StepVerifier.create(useCase.create(userId, command))
            .expectErrorMatches(e ->
                e instanceof ConflictException && e.getMessage().contains("SKU"))
            .verify();

        verify(productRepository).findBySku("SKU-001");
        verify(productRepository).findByBarcode("BAR-001");
        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("create() throws ConflictException when barcode already exists")
    void create_throwsConflictWhenBarcodeExists() {
        var existingProduct = Product.create("Existing", "OTHER-SKU", "BAR-001", BigDecimal.ONE);
        var command = new CreateProductCommand(
            "Test Product", "SKU-001", "BAR-001", null, null,
            BigDecimal.TEN, BigDecimal.valueOf(20), null, null, null
        );

        when(productRepository.findBySku("SKU-001")).thenReturn(Mono.empty());
        when(productRepository.findByBarcode("BAR-001")).thenReturn(Mono.just(existingProduct));

        StepVerifier.create(useCase.create(userId, command))
            .expectErrorMatches(e ->
                e instanceof ConflictException && e.getMessage().contains("Código de barras"))
            .verify();

        verify(productRepository).findBySku("SKU-001");
        verify(productRepository).findByBarcode("BAR-001");
        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("create() throws BadRequestException when category does not exist")
    void create_throwsBadRequestWhenCategoryNotFound() {
        var categoryId = UUID.randomUUID();
        var command = new CreateProductCommand(
            "Test Product", "SKU-001", "BAR-001", null, categoryId,
            BigDecimal.TEN, BigDecimal.valueOf(20), null, null, null
        );

        when(productRepository.findBySku("SKU-001")).thenReturn(Mono.empty());
        when(productRepository.findByBarcode("BAR-001")).thenReturn(Mono.empty());
        when(categoryRepository.findById(categoryId)).thenReturn(Mono.empty());

        StepVerifier.create(useCase.create(userId, command))
            .expectErrorMatches(e ->
                e instanceof BadRequestException && e.getMessage().contains("Categoría"))
            .verify();

        verify(categoryRepository).findById(categoryId);
        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("update() updates product when it exists")
    void update_success() {
        var productId = UUID.randomUUID();
        var existingProduct = Product.create("Old Name", "OLD-SKU", null, BigDecimal.ONE);
        var productWithId = new Product(
            productId, "OLD-SKU", null, "Old Name", null,
            null, Product.ProductStatus.ACTIVE, Product.CostMethod.INHERIT,
            BigDecimal.ONE, BigDecimal.ONE, null, "CUP", BigDecimal.ZERO, "UNIT",
            existingProduct.getCreatedAt(), existingProduct.getUpdatedAt(),
            0, null
        );
        var command = new UpdateProductCommand(
            "Updated Name", "NEW-SKU", "NEW-BAR", "Updated desc", null,
            Product.CostMethod.STANDARD, BigDecimal.valueOf(15), BigDecimal.valueOf(30),
            BigDecimal.valueOf(5), BigDecimal.valueOf(10), "BOX"
        );

        when(productRepository.findById(productId)).thenReturn(Mono.just(productWithId));
        when(productRepository.findBySku("NEW-SKU")).thenReturn(Mono.empty());
        when(productRepository.findByBarcode("NEW-BAR")).thenReturn(Mono.empty());
        when(productRepository.save(any())).thenAnswer(i -> Mono.just(i.getArgument(0)));
        lenient().when(auditLogger.log(any(), any(), any(), any(), any(), any())).thenReturn(Mono.empty());
        lenient().when(syncLogWriter.log(any(), any(), any(), any(), any())).thenReturn(Mono.empty());
        when(auditSerializer.toJsonTruncated(any())).thenReturn("{}");

        StepVerifier.create(useCase.update(productId, userId, command))
            .assertNext(product -> {
                assertThat(product.getName()).isEqualTo("Updated Name");
                assertThat(product.getSku()).isEqualTo("NEW-SKU");
                assertThat(product.getBarcode()).isEqualTo("NEW-BAR");
                assertThat(product.getStandardCost()).isEqualByComparingTo(BigDecimal.valueOf(15));
                assertThat(product.getSalePrice()).isEqualByComparingTo(BigDecimal.valueOf(30));
                assertThat(product.getCostMethod()).isEqualTo(Product.CostMethod.STANDARD);
            })
            .verifyComplete();

        verify(productRepository).findById(productId);
        verify(productRepository).save(any());
    }

    @Test
    @DisplayName("update() throws NotFoundException when product does not exist")
    void update_throwsNotFoundWhenProductMissing() {
        var productId = UUID.randomUUID();
        var command = new UpdateProductCommand(
            "Updated Name", "NEW-SKU", null, null, null,
            null, null, null, null, null, null
        );

        when(productRepository.findById(productId)).thenReturn(Mono.empty());

        StepVerifier.create(useCase.update(productId, userId, command))
            .expectErrorMatches(e ->
                e instanceof NotFoundException && e.getMessage().contains("Producto"))
            .verify();
    }

    @Test
    @DisplayName("archive() archives an existing product")
    void archive_success() {
        var productId = UUID.randomUUID();
        var activeProduct = new Product(
            productId, "SKU-001", null, "Test", null,
            null, Product.ProductStatus.ACTIVE, Product.CostMethod.INHERIT,
            null, BigDecimal.TEN, null, "CUP", BigDecimal.ZERO, "UNIT",
            null, null, 0, null
        );

        when(productRepository.findById(productId)).thenReturn(Mono.just(activeProduct));
        when(productRepository.save(any())).thenAnswer(i -> Mono.just(i.getArgument(0)));
        lenient().when(auditLogger.log(any(), any(), any(), any(), any(), any())).thenReturn(Mono.empty());
        lenient().when(syncLogWriter.log(any(), any(), any(), any(), any())).thenReturn(Mono.empty());
        when(auditSerializer.toJsonTruncated(any())).thenReturn("{}");

        StepVerifier.create(useCase.archive(productId, userId))
            .assertNext(product -> {
                assertThat(product.getStatus()).isEqualTo(Product.ProductStatus.ARCHIVED);
                assertThat(product.getId()).isEqualTo(productId);
            })
            .verifyComplete();

        verify(productRepository).save(any());
    }

    @Test
    @DisplayName("activate() activates an archived product")
    void activate_success() {
        var productId = UUID.randomUUID();
        var archivedProduct = new Product(
            productId, "SKU-001", null, "Test", null,
            null, Product.ProductStatus.ARCHIVED, Product.CostMethod.INHERIT,
            null, BigDecimal.TEN, null, "CUP", BigDecimal.ZERO, "UNIT",
            null, null, 0, null
        );

        when(productRepository.findById(productId)).thenReturn(Mono.just(archivedProduct));
        when(productRepository.save(any())).thenAnswer(i -> Mono.just(i.getArgument(0)));
        lenient().when(auditLogger.log(any(), any(), any(), any(), any(), any())).thenReturn(Mono.empty());
        lenient().when(syncLogWriter.log(any(), any(), any(), any(), any())).thenReturn(Mono.empty());
        when(auditSerializer.toJsonTruncated(any())).thenReturn("{}");

        StepVerifier.create(useCase.activate(productId, userId))
            .assertNext(product -> {
                assertThat(product.getStatus()).isEqualTo(Product.ProductStatus.ACTIVE);
                assertThat(product.getId()).isEqualTo(productId);
            })
            .verifyComplete();

        verify(productRepository).save(any());
    }

    @Test
    @DisplayName("delete() deletes existing product")
    void delete_success() {
        var productId = UUID.randomUUID();

        when(productRepository.deleteById(productId)).thenReturn(Mono.empty());
        when(productRepository.findById(productId)).thenReturn(Mono.just(Product.create("Test", "SKU-1", null, BigDecimal.ONE)));
        lenient().when(auditLogger.log(any(), any(), any(), any(), any(), any())).thenReturn(Mono.empty());
        lenient().when(syncLogWriter.log(any(), any(), any(), any(), any())).thenReturn(Mono.empty());
        when(auditSerializer.toJsonTruncated(any())).thenReturn("{}");

        StepVerifier.create(useCase.delete(productId, userId))
            .verifyComplete();

        verify(productRepository).findById(productId);
        verify(productRepository).deleteById(productId);
    }

    @Test
    @DisplayName("delete() throws NotFoundException when product does not exist")
    void delete_throwsNotFoundWhenProductMissing() {
        var productId = UUID.randomUUID();

        when(productRepository.findById(productId)).thenReturn(Mono.empty());

        StepVerifier.create(useCase.delete(productId, userId))
            .expectErrorMatches(e ->
                e instanceof NotFoundException && e.getMessage().contains("Producto"))
            .verify();

        verify(productRepository).findById(productId);
        verify(productRepository, never()).deleteById(any());
    }
}
