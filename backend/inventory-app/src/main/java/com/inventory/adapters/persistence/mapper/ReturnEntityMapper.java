package com.inventory.adapters.persistence.mapper;

import com.inventory.adapters.persistence.entity.ReturnEntity;
import com.inventory.adapters.persistence.entity.ReturnLineEntity;
import com.inventory.domain.model.Return;
import com.inventory.domain.model.ReturnLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.List;
import java.util.UUID;

/**
 * Mapper MapStruct para Return domain ↔ entity.
 */
@Mapper(componentModel = "spring")
public interface ReturnEntityMapper {

    @Mapping(target = "type", source = "type", qualifiedByName = "typeToString")
    @Mapping(target = "status", source = "status", qualifiedByName = "statusToString")
    ReturnEntity toEntity(Return domain);

    @Mapping(target = "type", source = "type", qualifiedByName = "stringToType")
    @Mapping(target = "status", source = "status", qualifiedByName = "stringToStatus")
    @Mapping(target = "lines", ignore = true)
    Return toDomain(ReturnEntity entity);

    default Return toDomain(ReturnEntity entity, List<ReturnLine> lines) {
        if (entity == null) return null;
        return new Return(
                entity.getId(),
                entity.getReturnNumber(),
                stringToType(entity.getType()),
                entity.getWarehouseId(),
                entity.getOriginalDocumentId(),
                stringToStatus(entity.getStatus()),
                entity.getReason(),
                entity.getNotes(),
                entity.getReturnDate(),
                entity.getCreatedBy(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                lines
        );
    }

    @Mapping(target = "returnId", ignore = true)
    ReturnLineEntity toLineEntity(ReturnLine line);

    default ReturnLineEntity toLineEntity(ReturnLine line, UUID returnId) {
        if (line == null) return null;
        return new ReturnLineEntity(
                line.getId(), returnId, line.getProductId(),
                line.getQuantity(), line.getUnitPrice(), line.getUnitCost(), line.getSortOrder()
        );
    }

    ReturnLine toLineDomain(ReturnLineEntity entity);

    @Named("typeToString")
    default String typeToString(Return.ReturnType type) {
        return type != null ? type.name() : null;
    }

    @Named("stringToType")
    default Return.ReturnType stringToType(String type) {
        return type != null ? Return.ReturnType.valueOf(type) : null;
    }

    @Named("statusToString")
    default String statusToString(Return.ReturnStatus status) {
        return status != null ? status.name() : null;
    }

    @Named("stringToStatus")
    default Return.ReturnStatus stringToStatus(String status) {
        return status != null ? Return.ReturnStatus.valueOf(status) : null;
    }
}
