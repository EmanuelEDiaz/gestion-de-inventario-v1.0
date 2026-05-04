package com.inventory.adapters.persistence.mapper;

import com.inventory.adapters.persistence.entity.InventoryMovementEntity;
import com.inventory.domain.model.InventoryMovement;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface InventoryMovementEntityMapper {

    default InventoryMovement toDomain(InventoryMovementEntity entity) {
        if (entity == null) return null;
        return new InventoryMovement(
            entity.getId(),
            entity.getWarehouseId(),
            entity.getProductId(),
            InventoryMovement.MovementType.valueOf(entity.getMovementType()),
            entity.getQuantity(),
            entity.getUnitCost(),
            entity.getUnitPrice(),
            entity.getTotalCost(),
            entity.getTotalPrice(),
            entity.getCurrencyCode(),
            entity.getExchangeRate(),
            entity.getBalanceAfter(),
            entity.getSourceDocType(),
            entity.getSourceDocId(),
            entity.getNotes(),
            entity.getOccurredAt(),
            entity.getCreatedBy(),
            entity.getCreatedAt()
        );
    }

    default InventoryMovementEntity toEntity(InventoryMovement domain) {
        if (domain == null) return null;
        InventoryMovementEntity entity = new InventoryMovementEntity();
        entity.setId(domain.getId());
        entity.setWarehouseId(domain.getWarehouseId());
        entity.setProductId(domain.getProductId());
        entity.setMovementType(domain.getMovementType().name());
        entity.setQuantity(domain.getQuantity());
        entity.setUnitCost(domain.getUnitCost());
        entity.setUnitPrice(domain.getUnitPrice());
        entity.setTotalCost(domain.getTotalCost());
        entity.setTotalPrice(domain.getTotalPrice());
        entity.setCurrencyCode(domain.getCurrencyCode());
        entity.setExchangeRate(domain.getExchangeRate());
        entity.setBalanceAfter(domain.getBalanceAfter());
        entity.setSourceDocType(domain.getSourceDocType());
        entity.setSourceDocId(domain.getSourceDocId());
        entity.setNotes(domain.getNotes());
        entity.setOccurredAt(domain.getOccurredAt());
        entity.setCreatedBy(domain.getCreatedBy());
        entity.setCreatedAt(domain.getCreatedAt());
        return entity;
    }
}
