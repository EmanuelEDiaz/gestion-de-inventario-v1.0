package com.inventory.application.usecase.query;

import com.inventory.adapters.persistence.repository.*;
import com.inventory.application.dto.DashboardStatsDto;
import com.inventory.application.dto.LowStockItemDto;
import com.inventory.domain.ports.in.DashboardQueryPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Estadísticas del dashboard - agrega datos de múltiples repositorios.
 */
@Service
public class DashboardQueryUseCase implements DashboardQueryPort {

    private final ProductR2dbcRepository productRepo;
    private final WarehouseR2dbcRepository warehouseRepo;
    private final CustomerR2dbcRepository customerRepo;
    private final SupplierR2dbcRepository supplierRepo;
    private final R2dbcStockBalanceRepository stockRepo;
    private final R2dbcSaleRepository saleRepo;
    private final R2dbcPurchaseRepository purchaseRepo;

    public DashboardQueryUseCase(
            ProductR2dbcRepository productRepo,
            WarehouseR2dbcRepository warehouseRepo,
            CustomerR2dbcRepository customerRepo,
            SupplierR2dbcRepository supplierRepo,
            R2dbcStockBalanceRepository stockRepo,
            R2dbcSaleRepository saleRepo,
            R2dbcPurchaseRepository purchaseRepo) {
        this.productRepo = productRepo;
        this.warehouseRepo = warehouseRepo;
        this.customerRepo = customerRepo;
        this.supplierRepo = supplierRepo;
        this.stockRepo = stockRepo;
        this.saleRepo = saleRepo;
        this.purchaseRepo = purchaseRepo;
    }

    @Override
    public Mono<DashboardStatsDto> getStats() {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(6);

        Mono<Long> totalProducts = productRepo.countByStatus("ACTIVE");
        Mono<Long> totalWarehouses = warehouseRepo.count();
        Mono<Long> totalCustomers = customerRepo.count();
        Mono<Long> totalSuppliers = supplierRepo.count();
        Mono<Long> lowStock = stockRepo.findBelowReorderPoint().count();
        Mono<Long> outOfStock = stockRepo.findOutOfStock().count();

        Mono<BigDecimal> salesToday = saleRepo.findByDateRange(today, today)
            .filter(s -> "CONFIRMED".equals(s.getStatus()))
            .map(s -> s.getTotal() != null ? s.getTotal() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        Mono<Long> salesTodayCount = saleRepo.findByDateRange(today, today)
            .filter(s -> "CONFIRMED".equals(s.getStatus()))
            .count();

        Mono<BigDecimal> salesWeek = saleRepo.findByDateRange(weekStart, today)
            .filter(s -> "CONFIRMED".equals(s.getStatus()))
            .map(s -> s.getTotal() != null ? s.getTotal() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        Mono<BigDecimal> purchasesWeek = purchaseRepo.findByDateRange(weekStart, today)
            .filter(p -> "RECEIVED".equals(p.getStatus()))
            .map(p -> p.getTotal() != null ? p.getTotal() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Mono.zip(
                objects -> {
                    long tp  = ((Long) objects[0]);
                    long tw  = ((Long) objects[1]);
                    long tc  = ((Long) objects[2]);
                    long ts  = ((Long) objects[3]);
                    long ls  = ((Long) objects[4]);
                    long oos = ((Long) objects[5]);
                    BigDecimal sd  = (BigDecimal) objects[6];
                    BigDecimal sw  = (BigDecimal) objects[7];
                    long sdc = ((Long) objects[8]);
                    BigDecimal pw  = (BigDecimal) objects[9];
                    return new DashboardStatsDto(tp, tw, tc, ts, ls, oos, sd, sw, sdc, pw);
                },
                totalProducts, totalWarehouses, totalCustomers, totalSuppliers,
                lowStock, outOfStock, salesToday, salesWeek, salesTodayCount, purchasesWeek
            ).cast(DashboardStatsDto.class);
    }

    @Override
    public Flux<LowStockItemDto> getLowStockItems() {
        return stockRepo.findBelowReorderPoint()
            .flatMap(sb -> productRepo.findById(sb.getProductId())
                .map(p -> new LowStockItemDto(
                    p.getId(),
                    p.getName(),
                    p.getSku(),
                    sb.getWarehouseId(),
                    null,   // warehouseName se puede enriquecer si se necesita
                    sb.getOnHand(),
                    p.getReorderPoint()
                ))
            )
            .take(20);
    }
}
