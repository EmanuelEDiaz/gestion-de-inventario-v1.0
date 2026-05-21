package com.inventory.adapters.persistence.mapper;

import com.inventory.adapters.persistence.entity.SaleEntity;
import com.inventory.adapters.persistence.entity.SaleLineEntity;
import com.inventory.domain.model.sale.Sale;
import com.inventory.domain.model.sale.SaleLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;
import java.util.UUID;

@Mapper(componentModel = "spring")
public interface SaleEntityMapper {

    @Mapping(target = "status", source = "status", qualifiedByName = "statusToString")
    @Mapping(target = "paymentMode", source = "paymentMode", qualifiedByName = "paymentModeToString")
    SaleEntity toEntity(Sale sale);

    @Named("statusToString")
    default String statusToString(Sale.SaleStatus status) {
        return status != null ? status.name() : null;
    }

    @Named("paymentModeToString")
    default String paymentModeToString(Sale.PaymentMode mode) {
        return mode != null ? mode.name() : Sale.PaymentMode.IMMEDIATE.name();
    }

    @Mapping(target = "status", source = "status", qualifiedByName = "stringToStatus")
    @Mapping(target = "paymentMode", source = "paymentMode", qualifiedByName = "stringToPaymentMode")
    @Mapping(target = "lines", ignore = true)
    Sale toDomain(SaleEntity entity);

    @Named("stringToStatus")
    default Sale.SaleStatus stringToStatus(String status) {
        return status != null ? Sale.SaleStatus.valueOf(status) : null;
    }

    @Named("stringToPaymentMode")
    default Sale.PaymentMode stringToPaymentMode(String mode) {
        return mode != null ? Sale.PaymentMode.valueOf(mode) : Sale.PaymentMode.IMMEDIATE;
    }

    default Sale toDomainWithLines(SaleEntity entity, List<SaleLineEntity> lineEntities) {
        Sale base = toDomain(entity);
        List<SaleLine> lines = lineEntities.stream()
            .map(this::lineToDomain)
            .toList();
        return new Sale(
            base.id(),
            base.saleNumber(),
            base.customerId(),
            base.warehouseId(),
            base.status(),
            base.paymentMode(),
            base.currencyCode(),
            base.exchangeRate(),
            base.subtotal(),
            base.discountAmount(),
            base.taxAmount(),
            base.total(),
            base.notes(),
            base.saleDate(),
            base.createdBy(),
            base.createdAt(),
            base.updatedAt(),
            lines
        );
    }

    SaleLine lineToDomain(SaleLineEntity entity);

    default SaleLineEntity lineToEntity(SaleLine line, UUID saleId) {
        SaleLineEntity entity = new SaleLineEntity();
        entity.setId(line.id());
        entity.setSaleId(saleId);
        entity.setProductId(line.productId());
        entity.setQuantity(line.quantity());
        entity.setUnitPrice(line.unitPrice());
        entity.setDiscount(line.discount());
        entity.setTotalPrice(line.totalPrice());
        entity.setSortOrder(line.sortOrder());
        return entity;
    }
}
