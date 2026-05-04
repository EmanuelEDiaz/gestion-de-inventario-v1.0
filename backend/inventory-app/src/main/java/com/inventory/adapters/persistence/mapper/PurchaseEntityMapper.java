package com.inventory.adapters.persistence.mapper;

import com.inventory.adapters.persistence.entity.PurchaseEntity;
import com.inventory.adapters.persistence.entity.PurchaseLineEntity;
import com.inventory.domain.model.Purchase;
import com.inventory.domain.model.PurchaseLine;
import org.mapstruct.Mapper;

import java.util.List;
import java.util.UUID;

@Mapper(componentModel = "spring")
public interface PurchaseEntityMapper {

    default Purchase toDomain(PurchaseEntity entity, List<PurchaseLineEntity> lineEntities) {
        if (entity == null) return null;
        
        List<PurchaseLine> lines = lineEntities.stream()
                .map(this::toLineDomain)
                .toList();
        
        return new Purchase(
            entity.getId(),
            entity.getPurchaseNumber(),
            entity.getSupplierId(),
            entity.getWarehouseId(),
            Purchase.PurchaseStatus.valueOf(entity.getStatus()),
            entity.getCurrencyCode(),
            entity.getExchangeRate(),
            entity.getSubtotal(),
            entity.getTaxAmount(),
            entity.getTotal(),
            entity.getNotes(),
            entity.getPurchaseDate(),
            entity.getReceivedDate(),
            entity.getCreatedBy(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            entity.getVersion() != null ? entity.getVersion() : 0,
            lines
        );
    }

    default PurchaseLine toLineDomain(PurchaseLineEntity entity) {
        if (entity == null) return null;
        return new PurchaseLine(
            entity.getId(),
            entity.getPurchaseId(),
            entity.getProductId(),
            entity.getQuantity(),
            entity.getUnitCost(),
            entity.getTotalCost(),
            entity.getReceivedQty(),
            entity.getSortOrder() != null ? entity.getSortOrder() : 0,
            entity.getCreatedAt()
        );
    }

    default PurchaseEntity toEntity(Purchase domain) {
        if (domain == null) return null;
        PurchaseEntity entity = new PurchaseEntity();
        entity.setId(domain.getId());
        entity.setPurchaseNumber(domain.getPurchaseNumber());
        entity.setSupplierId(domain.getSupplierId());
        entity.setWarehouseId(domain.getWarehouseId());
        entity.setStatus(domain.getStatus().name());
        entity.setCurrencyCode(domain.getCurrencyCode());
        entity.setExchangeRate(domain.getExchangeRate());
        entity.setSubtotal(domain.getSubtotal());
        entity.setTaxAmount(domain.getTaxAmount());
        entity.setTotal(domain.getTotal());
        entity.setNotes(domain.getNotes());
        entity.setPurchaseDate(domain.getPurchaseDate());
        entity.setReceivedDate(domain.getReceivedDate());
        entity.setCreatedBy(domain.getCreatedBy());
        entity.setCreatedAt(domain.getCreatedAt());
        entity.setUpdatedAt(domain.getUpdatedAt());
        entity.setVersion(domain.getVersion());
        return entity;
    }

    default PurchaseLineEntity toLineEntity(PurchaseLine domain, UUID purchaseId) {
        if (domain == null) return null;
        PurchaseLineEntity entity = new PurchaseLineEntity();
        entity.setId(domain.getId());
        entity.setPurchaseId(purchaseId);
        entity.setProductId(domain.getProductId());
        entity.setQuantity(domain.getQuantity());
        entity.setUnitCost(domain.getUnitCost());
        entity.setTotalCost(domain.getTotalCost());
        entity.setReceivedQty(domain.getReceivedQty());
        entity.setSortOrder(domain.getSortOrder());
        entity.setCreatedAt(domain.getCreatedAt());
        return entity;
    }
}
