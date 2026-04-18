package com.inventory.application.usecase.query;

import com.inventory.adapters.persistence.repository.*;
import com.inventory.adapters.persistence.entity.StockBalanceEntity;
import com.inventory.application.dto.DashboardStatsDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.math.BigDecimal;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Tests unitarios para DashboardQueryUseCase.
 * Verifica que los KPIs del dashboard se calculan correctamente.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DashboardQueryUseCase")
class DashboardQueryUseCaseTest {

    @Mock private ProductR2dbcRepository productRepo;
    @Mock private WarehouseR2dbcRepository warehouseRepo;
    @Mock private CustomerR2dbcRepository customerRepo;
    @Mock private SupplierR2dbcRepository supplierRepo;
    @Mock private R2dbcStockBalanceRepository stockRepo;
    @Mock private R2dbcSaleRepository saleRepo;
    @Mock private R2dbcPurchaseRepository purchaseRepo;

    private DashboardQueryUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new DashboardQueryUseCase(
            productRepo, warehouseRepo, customerRepo, supplierRepo,
            stockRepo, saleRepo, purchaseRepo
        );
    }

    @Test
    @DisplayName("getStats() retorna KPIs correctos con datos vacíos")
    void getStats_returnsZeroKPIsWhenNoData() {
        when(productRepo.countByStatus("ACTIVE")).thenReturn(Mono.just(0L));
        when(warehouseRepo.count()).thenReturn(Mono.just(0L));
        when(customerRepo.count()).thenReturn(Mono.just(0L));
        when(supplierRepo.count()).thenReturn(Mono.just(0L));
        when(stockRepo.findBelowReorderPoint()).thenReturn(Flux.empty());
        when(stockRepo.findOutOfStock()).thenReturn(Flux.empty());
        when(saleRepo.findByDateRange(any(), any())).thenReturn(Flux.empty());
        when(purchaseRepo.findByDateRange(any(), any())).thenReturn(Flux.empty());

        StepVerifier.create(useCase.getStats())
            .assertNext(stats -> {
                assert stats.totalProducts() == 0;
                assert stats.totalWarehouses() == 0;
                assert stats.totalCustomers() == 0;
                assert stats.totalSuppliers() == 0;
                assert stats.lowStockCount() == 0;
                assert stats.outOfStockCount() == 0;
                assert stats.salesToday().compareTo(BigDecimal.ZERO) == 0;
                assert stats.salesThisWeek().compareTo(BigDecimal.ZERO) == 0;
                assert stats.salesTodayCount() == 0;
                assert stats.purchasesThisWeek().compareTo(BigDecimal.ZERO) == 0;
            })
            .verifyComplete();
    }

    @Test
    @DisplayName("getStats() agrega correctamente múltiples KPIs")
    void getStats_aggregatesMultipleKPIs() {
        when(productRepo.countByStatus("ACTIVE")).thenReturn(Mono.just(42L));
        when(warehouseRepo.count()).thenReturn(Mono.just(3L));
        when(customerRepo.count()).thenReturn(Mono.just(100L));
        when(supplierRepo.count()).thenReturn(Mono.just(15L));
        when(stockRepo.findBelowReorderPoint()).thenReturn(Flux.just(
            mockStockEntity(), mockStockEntity()
        ));
        when(stockRepo.findOutOfStock()).thenReturn(Flux.just(mockStockEntity()));
        when(saleRepo.findByDateRange(any(), any())).thenReturn(Flux.empty());
        when(purchaseRepo.findByDateRange(any(), any())).thenReturn(Flux.empty());

        StepVerifier.create(useCase.getStats())
            .assertNext(stats -> {
                assert stats.totalProducts() == 42;
                assert stats.totalWarehouses() == 3;
                assert stats.totalCustomers() == 100;
                assert stats.totalSuppliers() == 15;
                assert stats.lowStockCount() == 2;
                assert stats.outOfStockCount() == 1;
            })
            .verifyComplete();
    }

    @Test
    @DisplayName("getLowStockItems() retorna máximo 20 items")
    void getLowStockItems_returnsMax20Items() {
        // Prepare 25 mock stock entities
        StockBalanceEntity[] entities = new StockBalanceEntity[25];
        for (int i = 0; i < 25; i++) entities[i] = mockStockEntity();

        // ProductEntity mock
        var mockProduct = new com.inventory.adapters.persistence.entity.ProductEntity();
        mockProduct.setId(UUID.randomUUID());
        mockProduct.setName("Producto Test");
        mockProduct.setSku("SKU-001");
        mockProduct.setReorderPoint(BigDecimal.TEN);

        when(stockRepo.findBelowReorderPoint()).thenReturn(Flux.fromArray(entities));
        when(productRepo.findById(any(UUID.class))).thenReturn(Mono.just(mockProduct));

        StepVerifier.create(useCase.getLowStockItems().count())
            .expectNext(20L)
            .verifyComplete();
    }

    private StockBalanceEntity mockStockEntity() {
        // Return a minimal entity — R2DBC entities have public setters
        var entity = new StockBalanceEntity();
        entity.setProductId(UUID.randomUUID());
        entity.setWarehouseId(UUID.randomUUID());
        entity.setOnHand(BigDecimal.valueOf(2));
        entity.setReserved(BigDecimal.ZERO);
        return entity;
    }
}
