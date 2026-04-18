package com.inventory.application.usecase.command;

import com.inventory.application.dto.CreateSaleRequest;
import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.model.Sale;
import com.inventory.domain.model.SaleLine;
import com.inventory.domain.model.StockBalance;
import com.inventory.domain.ports.out.MovementRepository;
import com.inventory.domain.ports.out.SaleRepository;
import com.inventory.domain.ports.out.StockRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Tests unitarios para SaleCommandUseCase.
 * Aísla la lógica de use case usando mocks de los ports de salida.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SaleCommandUseCase")
class SaleCommandUseCaseTest {

    @Mock
    private SaleRepository saleRepository;
    @Mock
    private StockRepository stockRepository;
    @Mock
    private MovementRepository movementRepository;

    private SaleCommandUseCase useCase;

    private final UUID warehouseId = UUID.randomUUID();
    private final UUID productId = UUID.randomUUID();
    private final UUID userId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        useCase = new SaleCommandUseCase(saleRepository, stockRepository, movementRepository);
    }

    @Test
    @DisplayName("create() falla cuando warehouseId es null")
    void create_failsWithNullWarehouseId() {
        CreateSaleRequest request = new CreateSaleRequest(
            null, null, "USD", null, LocalDate.now(),
            List.of(new CreateSaleRequest.SaleLineRequest(productId, 1, BigDecimal.TEN, null))
        );

        StepVerifier.create(useCase.create(request, userId))
            .expectErrorMatches(e -> e instanceof BadRequestException &&
                e.getMessage().contains("Warehouse"))
            .verify();
    }

    @Test
    @DisplayName("create() falla cuando lines está vacío")
    void create_failsWithEmptyLines() {
        CreateSaleRequest request = new CreateSaleRequest(
            warehouseId, null, "USD", null, LocalDate.now(), List.of()
        );

        StepVerifier.create(useCase.create(request, userId))
            .expectErrorMatches(e -> e instanceof BadRequestException &&
                e.getMessage().contains("line"))
            .verify();
    }

    @Test
    @DisplayName("create() crea un borrador de venta cuando datos son válidos")
    void create_createsDraftSaleWithValidData() {
        CreateSaleRequest request = new CreateSaleRequest(
            warehouseId, null, "USD", null, LocalDate.now(),
            List.of(new CreateSaleRequest.SaleLineRequest(productId, 2, BigDecimal.valueOf(50), null))
        );

        Sale expectedSale = Sale.createDraft(
            "VEN-001", warehouseId, null, "USD", null, LocalDate.now(),
            List.of(SaleLine.create(productId, 2, BigDecimal.valueOf(50), null, 1)),
            userId
        );

        when(saleRepository.generateSaleNumber()).thenReturn(Mono.just("VEN-001"));
        when(saleRepository.save(any(Sale.class))).thenReturn(Mono.just(expectedSale));

        StepVerifier.create(useCase.create(request, userId))
            .assertNext(sale -> {
                assert sale.status() == Sale.SaleStatus.DRAFT;
                assert sale.warehouseId().equals(warehouseId);
                assert sale.lines().size() == 1;
            })
            .verifyComplete();
    }

    @Test
    @DisplayName("confirm() falla cuando la venta no existe")
    void confirm_failsWhenSaleNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(saleRepository.findById(nonExistentId)).thenReturn(Mono.empty());

        StepVerifier.create(useCase.confirm(nonExistentId))
            .expectErrorMatches(e -> e.getMessage().contains("Sale not found"))
            .verify();
    }

    @Test
    @DisplayName("confirm() falla cuando no hay stock suficiente")
    void confirm_failsWhenInsufficientStock() {
        UUID saleId = UUID.randomUUID();
        Sale draft = Sale.createDraft(
            "VEN-001", warehouseId, null, "USD", null, LocalDate.now(),
            List.of(SaleLine.create(productId, 10, BigDecimal.valueOf(50), null, 1)),
            userId
        );

        StockBalance lowStock = new StockBalance(
            warehouseId, productId, BigDecimal.valueOf(5), BigDecimal.ZERO, BigDecimal.valueOf(50), null
        );

        when(saleRepository.findById(saleId)).thenReturn(Mono.just(draft));
        when(stockRepository.findById(warehouseId, productId)).thenReturn(Mono.just(lowStock));
        // save() not reached because stock is insufficient, but mock needed to avoid NPE in Flux.then()
        when(saleRepository.save(any(Sale.class))).thenReturn(Mono.just(draft));

        StepVerifier.create(useCase.confirm(saleId))
            .expectErrorMatches(e -> e instanceof BadRequestException &&
                e.getMessage().contains("Insufficient stock"))
            .verify();
    }
}
