package com.inventory.application.mapper;

import com.inventory.application.customer.dto.CustomerDto;
import com.inventory.domain.model.customer.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

/**
 * Mapper entre Customer domain y DTOs.
 */
@Mapper(componentModel = MappingConstants.ComponentModel.SPRING)
public interface CustomerMapper {
    CustomerDto toDto(Customer customer);
}
