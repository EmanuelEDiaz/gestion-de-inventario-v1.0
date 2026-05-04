package com.inventory.application.mapper;

import com.inventory.application.dto.SaleDto;
import com.inventory.domain.model.Sale;
import com.inventory.domain.model.SaleLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring")
public interface SaleMapper {

    @Mapping(target = "customerName", ignore = true)
    @Mapping(target = "warehouseName", ignore = true)
    @Mapping(target = "status", source = "status", qualifiedByName = "statusToString")
    @Mapping(target = "lines", source = "lines", qualifiedByName = "linesToDtos")
    @Mapping(target = "paymentMode", source = "paymentMode", qualifiedByName = "paymentModeToString")
    @Mapping(target = "debtId", ignore = true)
    SaleDto toDto(Sale sale);

    @Named("statusToString")
    default String statusToString(Sale.SaleStatus status) {
        return status != null ? status.name() : null;
    }

    @Named("paymentModeToString")
    default String paymentModeToString(Sale.PaymentMode mode) {
        return mode != null ? mode.name() : null;
    }

    @Named("linesToDtos")
    default List<SaleDto.SaleLineDto> linesToDtos(List<SaleLine> lines) {
        if (lines == null) return List.of();
        return lines.stream()
            .map(this::lineToDto)
            .toList();
    }

    @Mapping(target = "productName", ignore = true)
    @Mapping(target = "productSku", ignore = true)
    SaleDto.SaleLineDto lineToDto(SaleLine line);
}
