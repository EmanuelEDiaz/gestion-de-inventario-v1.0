package com.inventory.adapters.persistence.mapper;

import com.inventory.adapters.persistence.entity.TransferEntity;
import com.inventory.adapters.persistence.entity.TransferLineEntity;
import com.inventory.domain.model.Transfer;
import com.inventory.domain.model.TransferLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
import java.util.UUID;

/**
 * Mapper: Transfer domain ↔ Entity.
 * MapStruct genera la implementación en compile-time.
 */
@Mapper(componentModel = "spring")
public interface TransferEntityMapper {

    @Mapping(target = "status", expression = "java(transfer.getStatus().name())")
    TransferEntity toEntity(Transfer transfer);

    @Mapping(target = "status", expression = "java(com.inventory.domain.model.Transfer.TransferStatus.valueOf(entity.getStatus()))")
    @Mapping(target = "lines", ignore = true)
    Transfer toDomain(TransferEntity entity);

    default Transfer toDomainWithLines(TransferEntity entity, List<TransferLine> lines) {
        return new Transfer(
            entity.getId(),
            entity.getTransferNumber(),
            entity.getFromWarehouseId(),
            entity.getToWarehouseId(),
            Transfer.TransferStatus.valueOf(entity.getStatus()),
            entity.getNotes(),
            entity.getTransferDate(),
            entity.getReceivedDate(),
            entity.getCreatedBy(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            lines
        );
    }

    TransferLineEntity toLineEntity(TransferLine line);

    @Mapping(target = "transferId", source = "transferId")
    default TransferLineEntity toLineEntityWithTransferId(TransferLine line, UUID transferId) {
        TransferLineEntity entity = new TransferLineEntity();
        entity.setId(line.getId());
        entity.setTransferId(transferId);
        entity.setProductId(line.getProductId());
        entity.setQuantity(line.getQuantity());
        entity.setReceivedQty(line.getReceivedQty());
        entity.setSortOrder(line.getSortOrder());
        return entity;
    }

    default TransferLine toLineDomain(TransferLineEntity entity) {
        return new TransferLine(
            entity.getId(),
            entity.getProductId(),
            entity.getQuantity(),
            entity.getReceivedQty(),
            entity.getSortOrder()
        );
    }

    List<TransferLine> toLineDomains(List<TransferLineEntity> entities);
}
