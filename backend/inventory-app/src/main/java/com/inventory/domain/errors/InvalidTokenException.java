package com.inventory.domain.errors;

/**
 * Excepción lanzada cuando un token es inválido o ha expirado.
 */
public class InvalidTokenException extends DomainException {
    
    public InvalidTokenException() {
        super("AUTH_INVALID_TOKEN", "Invalid or expired token");
    }
    
    public InvalidTokenException(String message) {
        super("AUTH_INVALID_TOKEN", message);
    }
}
