package com.inventory.application.usecase.query;

import com.inventory.domain.model.product.Product;
import com.inventory.domain.model.sale.Sale;
import com.inventory.domain.ports.in.stock.DashboardQueryPort;
import com.inventory.domain.ports.out.CustomerRepository;
import com.inventory.domain.ports.out.ProductRepository;
import com.inventory.domain.ports.out.PurchaseRepository;
import com.inventory.domain.ports.out.SaleRepository;
import com.inventory.domain.ports.out.StockRepository;
import com.inventory.domain.ports.out.SupplierRepository;
import com.inventory.domain.ports.out.WarehouseRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Estadísticas del dashboard — agrega datos usando puertos de dominio.
 */
@Service
public class DashboardQueryUseCase implements DashboardQueryPort {

    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final StockRepository stockRepository;
    private final SaleRepository saleRepository;
    private final PurchaseRepository purchaseRepository;

    public DashboardQueryUseCase(
            ProductRepository productRepository,
            WarehouseRepository warehouseRepository,
            CustomerRepository customerRepository,
            SupplierRepository supplierRepository,
            StockRepository stockRepository,
            SaleRepository saleRepository,
            PurchaseRepository purchaseRepository) {
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
        this.customerRepository = customerRepository;
        this.supplierRepository = supplierRepository;
        this.stockRepository = stockRepository;
        this.saleRepository = saleRepository;
        this.purchaseRepository = purchaseRepository;
    }

    @Override
    public Mono<DashboardStats> getStats() {
        LocalDate today = LocalDate.now();
        LocalDate weekStart = today.minusDays(6);

        Mono<Long> totalProducts   = productRepository.countByStatus(Product.ProductStatus.ACTIVE);
        Mono<Long> totalWarehouses = warehouseRepository.findAll().count();
        Mono<Long> totalCustomers  = customerRepository.findAll().count();
        Mono<Long> totalSuppliers  = supplierRepository.findAll().count();
        Mono<Long> lowStock        = stockRepository.findBelowReorderPoint().count();
        Mono<Long> outOfStock      = stockRepository.findOutOfStock().count();

        Mono<BigDecimal> salesToday = saleRepository.findByDateRange(today, today)
            .filter(s -> Sale.SaleStatus.CONFIRMED == s.status())
            .map(s -> s.total() != null ? s.total() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        Mono<Long> salesTodayCount = saleRepository.findByDateRange(today, today)
            .filter(s -> Sale.SaleStatus.CONFIRMED == s.status())
            .count();

        Mono<BigDecimal> salesWeek = saleRepository.findByDateRange(weekStart, today)
            .filter(s -> Sale.SaleStatus.CONFIRMED == s.status())
            .map(s -> s.total() != null ? s.total() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        Mono<BigDecimal> purchasesWeek = purchaseRepository.findByDateRange(weekStart, today)
            .filter(p -> "RECEIVED".equals(p.getStatus().name()))
            .map(p -> p.getTotal() != null ? p.getTotal() : BigDecimal.ZERO)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Mono.zip(
                objects -> {
                    long tp  = (Long) objects[0];
                    long tw  = (Long) objects[1];
                    long tc  = (Long) objects[2];
                    long ts  = (Long) objects[3];
                    long ls  = (Long) objects[4];
                    long oos = (Long) objects[5];
                    BigDecimal sd  = (BigDecimal) objects[6];
                    BigDecimal sw  = (BigDecimal) objects[7];
                    long sdc = (Long) objects[8];
                    BigDecimal pw  = (BigDecimal) objects[9];
                    return new DashboardStats(tp, tw, tc, ts, ls, oos, sd, sw, sdc, pw);
                },
                totalProducts, totalWarehouses, totalCustomers, totalSuppliers,
                lowStock, outOfStock, salesToday, salesWeek, salesTodayCount, purchasesWeek
            ).cast(DashboardStats.class);
    }

    @Override
    public Flux<LowStockItem> getLowStockItems() {
        return stockRepository.findBelowReorderPoint()
            .flatMap(sb -> productRepository.findById(sb.getProductId())
                .map(p -> new LowStockItem(
                    p.getId(),
                    p.getName(),
                    p.getSku(),
                    sb.getWarehouseId(),
                    null,
                    sb.getOnHand(),
                    p.getReorderPoint()
                ))
            )
            .take(20);
    }
}
