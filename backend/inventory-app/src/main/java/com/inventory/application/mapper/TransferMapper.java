package com.inventory.application.mapper;

import com.inventory.application.dto.TransferDto;
import com.inventory.domain.model.Transfer;
import com.inventory.domain.model.TransferLine;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * Mapper: Transfer domain → DTO.
 * MapStruct genera la implementación en compile-time.
 */
@Mapper(componentModel = "spring")
public interface TransferMapper {

    @Mapping(target = "fromWarehouseName", ignore = true)
    @Mapping(target = "toWarehouseName", ignore = true)
    @Mapping(target = "status", expression = "java(transfer.getStatus().name())")
    TransferDto toDto(Transfer transfer);

    @Mapping(target = "productName", ignore = true)
    @Mapping(target = "productSku", ignore = true)
    TransferDto.TransferLineDto toLineDto(TransferLine line);

    List<TransferDto.TransferLineDto> toLineDtos(List<TransferLine> lines);

    default TransferDto toDtoWithNames(Transfer transfer, String fromName, String toName) {
        return new TransferDto(
            transfer.getId(),
            transfer.getTransferNumber(),
            transfer.getFromWarehouseId(),
            fromName,
            transfer.getToWarehouseId(),
            toName,
            transfer.getStatus().name(),
            transfer.getNotes(),
            transfer.getTransferDate(),
            transfer.getReceivedDate(),
            transfer.getCreatedBy(),
            transfer.getCreatedAt(),
            transfer.getUpdatedAt(),
            toLineDtos(transfer.getLines())
        );
    }
}
