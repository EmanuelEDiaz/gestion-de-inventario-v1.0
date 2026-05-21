package com.inventory.adapters.persistence.adapter.mapper;

import com.inventory.adapters.persistence.adapter.entity.AdjustmentEntity;
import com.inventory.adapters.persistence.adapter.entity.AdjustmentLineEntity;
import com.inventory.domain.model.adjustment.Adjustment;
import com.inventory.domain.model.adjustment.AdjustmentLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;
import java.util.UUID;

/**
 * Mapper MapStruct para Adjustment domain ↔ entity.
 */
@Mapper(componentModel = "spring")
public interface AdjustmentEntityMapper {

    @Mapping(target = "type", source = "type", qualifiedByName = "typeToString")
    @Mapping(target = "status", source = "status", qualifiedByName = "statusToString")
    AdjustmentEntity toEntity(Adjustment domain);

    @Mapping(target = "type", source = "type", qualifiedByName = "stringToType")
    @Mapping(target = "status", source = "status", qualifiedByName = "stringToStatus")
    @Mapping(target = "lines", ignore = true)
    Adjustment toDomain(AdjustmentEntity entity);

    default Adjustment toDomain(AdjustmentEntity entity, List<AdjustmentLine> lines) {
        if (entity == null) return null;
        return new Adjustment(
                entity.getId(),
                entity.getAdjustmentNumber(),
                entity.getWarehouseId(),
                stringToType(entity.getType()),
                stringToStatus(entity.getStatus()),
                entity.getReason(),
                entity.getNotes(),
                entity.getAdjustmentDate(),
                entity.getCreatedBy(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                lines
        );
    }

    @Mapping(target = "adjustmentId", ignore = true)
    AdjustmentLineEntity toLineEntity(AdjustmentLine line);

    default AdjustmentLineEntity toLineEntity(AdjustmentLine line, UUID adjustmentId) {
        if (line == null) return null;
        return new AdjustmentLineEntity(
                line.getId(), adjustmentId, line.getProductId(),
                line.getSystemQty(), line.getCountedQty(), line.getDifference(),
                line.getUnitCost(), line.getSortOrder()
        );
    }

    AdjustmentLine toLineDomain(AdjustmentLineEntity entity);

    @Named("typeToString")
    default String typeToString(Adjustment.AdjustmentType type) {
        return type != null ? type.name() : null;
    }

    @Named("stringToType")
    default Adjustment.AdjustmentType stringToType(String type) {
        return type != null ? Adjustment.AdjustmentType.valueOf(type) : null;
    }

    @Named("statusToString")
    default String statusToString(Adjustment.AdjustmentStatus status) {
        return status != null ? status.name() : null;
    }

    @Named("stringToStatus")
    default Adjustment.AdjustmentStatus stringToStatus(String status) {
        return status != null ? Adjustment.AdjustmentStatus.valueOf(status) : null;
    }
}
