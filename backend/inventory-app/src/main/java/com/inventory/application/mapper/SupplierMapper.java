package com.inventory.application.mapper;

import com.inventory.application.dto.SupplierDto;
import com.inventory.domain.model.supplier.Supplier;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

/**
 * Mapper entre Supplier domain y DTOs.
 */
@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface SupplierMapper {
    SupplierDto toDto(Supplier supplier);
}
