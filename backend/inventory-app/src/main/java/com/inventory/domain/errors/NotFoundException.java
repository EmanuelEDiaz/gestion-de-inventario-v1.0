package com.inventory.domain.errors;

/**
 * Excepción cuando no se encuentra un recurso.
 */
public class NotFoundException extends DomainException {
    
    public NotFoundException(String resourceType, String identifier) {
        super("NOT_FOUND", resourceType + " no encontrado: " + identifier);
    }
    
    public NotFoundException(String message) {
        super("NOT_FOUND", message);
    }
}
