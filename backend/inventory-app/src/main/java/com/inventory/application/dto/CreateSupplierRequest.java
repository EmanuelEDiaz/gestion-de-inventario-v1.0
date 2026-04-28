package com.inventory.application.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request para crear un proveedor.
 */
public record CreateSupplierRequest(
    @Size(max = 50, message = "Code must be at most 50 characters")
    String code,
    
    @NotBlank(message = "Name is required")
    @Size(max = 200, message = "Name must be at most 200 characters")
    String name,
    
    @Size(max = 100, message = "Contact name must be at most 100 characters")
    String contactName,
    
    @Size(max = 30, message = "Phone must be at most 30 characters")
    String phone,
    
    @Email(message = "Email must be valid")
    @Size(max = 100, message = "Email must be at most 100 characters")
    String email,
    
    @Size(max = 300, message = "Address must be at most 300 characters")
    String address,
    
    String notes,
    String website
) {}
