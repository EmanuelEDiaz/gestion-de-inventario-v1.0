package com.inventory.domain.errors;

/**
 * Excepción cuando hay conflicto de recursos (duplicados, etc).
 */
public class ConflictException extends DomainException {
    
    public ConflictException(String message) {
        super("CONFLICT", message);
    }
    
    public ConflictException(String field, String value) {
        super("CONFLICT", field + " ya existe: " + value);
    }
}
