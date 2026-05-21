package com.inventory.application.mapper;

import com.inventory.application.dto.MovementDto;
import com.inventory.domain.model.stock.InventoryMovement;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface MovementMapper {

    @Mapping(target = "warehouseName", ignore = true)
    @Mapping(target = "productName", ignore = true)
    @Mapping(target = "productSku", ignore = true)
    @Mapping(target = "movementType", expression = "java(domain.getMovementType().name())")
    MovementDto toDto(InventoryMovement domain);

    default MovementDto toDto(InventoryMovement domain, String warehouseName, String productName, String productSku) {
        return new MovementDto(
            domain.getId(),
            domain.getWarehouseId(),
            domain.getProductId(),
            warehouseName,
            productName,
            productSku,
            domain.getMovementType().name(),
            domain.getQuantity(),
            domain.getUnitCost(),
            domain.getUnitPrice(),
            domain.getTotalCost(),
            domain.getTotalPrice(),
            domain.getCurrencyCode(),
            domain.getExchangeRate(),
            domain.getBalanceAfter(),
            domain.getSourceDocType(),
            domain.getSourceDocId(),
            domain.getNotes(),
            domain.getOccurredAt(),
            domain.getCreatedBy(),
            domain.getCreatedAt()
        );
    }
}
