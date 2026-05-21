package com.inventory.adapters.web.dto.warehouse;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO de actualización para Almacén.
 */
public record UpdateWarehouseRequest(
    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    String name,
    
    @Size(max = 500, message = "La dirección no puede exceder 500 caracteres")
    String address,
    
    Boolean active
) {}
