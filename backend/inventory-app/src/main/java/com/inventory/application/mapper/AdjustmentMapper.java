package com.inventory.application.mapper;

import com.inventory.application.dto.AdjustmentDto;
import com.inventory.domain.model.Adjustment;
import com.inventory.domain.model.AdjustmentLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * Mapper MapStruct para Adjustment domain → DTO.
 */
@Mapper(componentModel = "spring")
public interface AdjustmentMapper {

    @Mapping(target = "type", source = "type")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "warehouseName", ignore = true)
    @Mapping(target = "lines", source = "lines")
    AdjustmentDto toDto(Adjustment adjustment);

    @Mapping(target = "productName", ignore = true)
    @Mapping(target = "productSku", ignore = true)
    AdjustmentDto.LineDto toLineDto(AdjustmentLine line);

    List<AdjustmentDto.LineDto> toLineDtos(List<AdjustmentLine> lines);

    default String mapType(Adjustment.AdjustmentType type) {
        return type != null ? type.name() : null;
    }

    default String mapStatus(Adjustment.AdjustmentStatus status) {
        return status != null ? status.name() : null;
    }
}
