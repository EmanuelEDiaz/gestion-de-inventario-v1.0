package com.inventory.adapters.persistence.adapter.mapper;

import com.inventory.adapters.persistence.adapter.entity.StockBalanceEntity;
import com.inventory.domain.model.stock.StockBalance;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface StockBalanceEntityMapper {

    default StockBalance toDomain(StockBalanceEntity entity) {
        if (entity == null) return null;
        return new StockBalance(
            entity.getWarehouseId(),
            entity.getProductId(),
            entity.getOnHand(),
            entity.getReserved(),
            entity.getAvgCost(),
            entity.getUpdatedAt()
        );
    }

    default StockBalanceEntity toEntity(StockBalance domain) {
        if (domain == null) return null;
        return new StockBalanceEntity(
            domain.getWarehouseId(),
            domain.getProductId(),
            domain.getOnHand(),
            domain.getReserved(),
            domain.getAvgCost(),
            domain.getUpdatedAt()
        );
    }
}
