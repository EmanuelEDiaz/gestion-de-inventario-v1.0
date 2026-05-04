package com.inventory.application.usecase.query;

import com.inventory.domain.model.Product;
import com.inventory.domain.model.StockBalance;
import com.inventory.domain.ports.out.CustomerRepository;
import com.inventory.domain.ports.out.ProductRepository;
import com.inventory.domain.ports.out.PurchaseRepository;
import com.inventory.domain.ports.out.SaleRepository;
import com.inventory.domain.ports.out.StockRepository;
import com.inventory.domain.ports.out.SupplierRepository;
import com.inventory.domain.ports.out.WarehouseRepository;
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
import java.time.Instant;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("DashboardQueryUseCase")
class DashboardQueryUseCaseTest {

    @Mock private ProductRepository productRepository;
    @Mock private WarehouseRepository warehouseRepository;
    @Mock private CustomerRepository customerRepository;
    @Mock private SupplierRepository supplierRepository;
    @Mock private StockRepository stockRepository;
    @Mock private SaleRepository saleRepository;
    @Mock private PurchaseRepository purchaseRepository;

    private DashboardQueryUseCase useCase;

    @BeforeEach
    void setUp() {
        useCase = new DashboardQueryUseCase(
            productRepository, warehouseRepository, customerRepository, supplierRepository,
            stockRepository, saleRepository, purchaseRepository
        );
    }

    @Test
    @DisplayName("getStats() retorna KPIs correctos con datos vacios")
    void getStats_returnsZeroKPIsWhenNoData() {
        when(productRepository.countByStatus(Product.ProductStatus.ACTIVE)).thenReturn(Mono.just(0L));
        when(warehouseRepository.findAll()).thenReturn(Flux.empty());
        when(customerRepository.findAll()).thenReturn(Flux.empty());
        when(supplierRepository.findAll()).thenReturn(Flux.empty());
        when(stockRepository.findBelowReorderPoint()).thenReturn(Flux.empty());
        when(stockRepository.findOutOfStock()).thenReturn(Flux.empty());
        when(saleRepository.findByDateRange(any(), any())).thenReturn(Flux.empty());
        when(purchaseRepository.findByDateRange(any(), any())).thenReturn(Flux.empty());

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
    @DisplayName("getStats() agrega correctamente multiples KPIs")
    void getStats_aggregatesMultipleKPIs() {
        when(productRepository.countByStatus(Product.ProductStatus.ACTIVE)).thenReturn(Mono.just(42L));
        when(warehouseRepository.findAll()).thenReturn(Flux.empty());
        when(customerRepository.findAll()).thenReturn(Flux.empty());
        when(supplierRepository.findAll()).thenReturn(Flux.empty());
        when(stockRepository.findBelowReorderPoint()).thenReturn(Flux.just(mockStockBalance(), mockStockBalance()));
        when(stockRepository.findOutOfStock()).thenReturn(Flux.just(mockStockBalance()));
        when(saleRepository.findByDateRange(any(), any())).thenReturn(Flux.empty());
        when(purchaseRepository.findByDateRange(any(), any())).thenReturn(Flux.empty());

        StepVerifier.create(useCase.getStats())
            .assertNext(stats -> {
                assert stats.totalProducts() == 42;
                assert stats.lowStockCount() == 2;
                assert stats.outOfStockCount() == 1;
            })
            .verifyComplete();
    }

    private StockBalance mockStockBalance() {
        return new StockBalance(
            UUID.randomUUID(), UUID.randomUUID(),
            BigDecimal.valueOf(2), BigDecimal.ZERO,
            BigDecimal.ONE, Instant.now()
        );
    }
}
