package com.inventory.domain.errors;

/**
 * Excepción para solicitudes inválidas.
 */
public class BadRequestException extends DomainException {
    
    public BadRequestException(String message) {
        super("BAD_REQUEST", message);
    }
}
