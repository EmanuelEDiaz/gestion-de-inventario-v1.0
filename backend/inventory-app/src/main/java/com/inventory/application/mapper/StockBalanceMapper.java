package com.inventory.application.mapper;

import com.inventory.application.dto.StockBalanceDto;
import com.inventory.domain.model.stock.StockBalance;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface StockBalanceMapper {

    @Mapping(target = "warehouseName", ignore = true)
    @Mapping(target = "productName", ignore = true)
    @Mapping(target = "productSku", ignore = true)
    @Mapping(target = "available", expression = "java(domain.getAvailable())")
    @Mapping(target = "totalValue", expression = "java(domain.getTotalValue())")
    StockBalanceDto toDto(StockBalance domain);

    default StockBalanceDto toDto(StockBalance domain, String warehouseName, String productName, String productSku) {
        return new StockBalanceDto(
            domain.getWarehouseId(),
            domain.getProductId(),
            warehouseName,
            productName,
            productSku,
            domain.getOnHand(),
            domain.getReserved(),
            domain.getAvailable(),
            domain.getAvgCost(),
            domain.getTotalValue(),
            domain.getUpdatedAt()
        );
    }
}
