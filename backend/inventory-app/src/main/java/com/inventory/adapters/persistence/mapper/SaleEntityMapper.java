package com.inventory.adapters.persistence.mapper;

import com.inventory.adapters.persistence.entity.SaleEntity;
import com.inventory.adapters.persistence.entity.SaleLineEntity;
import com.inventory.domain.model.Sale;
import com.inventory.domain.model.SaleLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;
import java.util.UUID;

@Mapper(componentModel = "spring")
public interface SaleEntityMapper {

    @Mapping(target = "status", source = "status", qualifiedByName = "statusToString")
    SaleEntity toEntity(Sale sale);

    @Named("statusToString")
    default String statusToString(Sale.SaleStatus status) {
        return status != null ? status.name() : null;
    }

    @Mapping(target = "status", source = "status", qualifiedByName = "stringToStatus")
    @Mapping(target = "lines", ignore = true)
    Sale toDomain(SaleEntity entity);

    @Named("stringToStatus")
    default Sale.SaleStatus stringToStatus(String status) {
        return status != null ? Sale.SaleStatus.valueOf(status) : null;
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
