package com.inventory.application.mapper;

import com.inventory.application.dto.PurchaseDto;
import com.inventory.domain.model.purchase.Purchase;
import com.inventory.domain.model.purchase.PurchaseLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PurchaseMapper {

    @Mapping(target = "supplierName", ignore = true)
    @Mapping(target = "warehouseName", ignore = true)
    @Mapping(target = "status", expression = "java(domain.getStatus().name())")
    @Mapping(target = "lines", source = "lines")
    PurchaseDto toDto(Purchase domain);

    @Mapping(target = "productName", ignore = true)
    @Mapping(target = "productSku", ignore = true)
    PurchaseDto.PurchaseLineDto toLineDto(PurchaseLine line);

    List<PurchaseDto.PurchaseLineDto> toLineDtos(List<PurchaseLine> lines);

    default PurchaseDto toDto(Purchase domain, String supplierName, String warehouseName) {
        List<PurchaseDto.PurchaseLineDto> lineDtos = toLineDtos(domain.getLines());
        return new PurchaseDto(
            domain.getId(),
            domain.getPurchaseNumber(),
            domain.getSupplierId(),
            supplierName,
            domain.getWarehouseId(),
            warehouseName,
            domain.getStatus().name(),
            domain.getCurrencyCode(),
            domain.getExchangeRate(),
            domain.getSubtotal(),
            domain.getTaxAmount(),
            domain.getTotal(),
            domain.getNotes(),
            domain.getPurchaseDate(),
            domain.getReceivedDate(),
            domain.getCreatedBy(),
            domain.getCreatedAt(),
            domain.getUpdatedAt(),
            lineDtos
        );
    }
}
