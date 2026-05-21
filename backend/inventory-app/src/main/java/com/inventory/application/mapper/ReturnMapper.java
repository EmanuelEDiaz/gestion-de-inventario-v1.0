package com.inventory.application.mapper;

import com.inventory.application.returns.dto.ReturnDto;
import com.inventory.domain.model.returns.Return;
import com.inventory.domain.model.returns.ReturnLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * Mapper MapStruct para Return domain → DTO.
 */
@Mapper(componentModel = "spring")
public interface ReturnMapper {

    @Mapping(target = "type", source = "type")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "warehouseName", ignore = true)
    @Mapping(target = "totalAmount", expression = "java(returnEntity.getTotalAmount())")
    @Mapping(target = "lines", source = "lines")
    ReturnDto toDto(Return returnEntity);

    @Mapping(target = "productName", ignore = true)
    @Mapping(target = "productSku", ignore = true)
    @Mapping(target = "subtotal", expression = "java(line.getSubtotal())")
    ReturnDto.LineDto toLineDto(ReturnLine line);

    List<ReturnDto.LineDto> toLineDtos(List<ReturnLine> lines);

    default String mapType(Return.ReturnType type) {
        return type != null ? type.name() : null;
    }

    default String mapStatus(Return.ReturnStatus status) {
        return status != null ? status.name() : null;
    }
}
