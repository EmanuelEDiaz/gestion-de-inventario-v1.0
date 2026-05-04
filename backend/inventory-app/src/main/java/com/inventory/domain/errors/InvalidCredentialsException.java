package com.inventory.domain.errors;

/**
 * Excepción lanzada cuando las credenciales de autenticación son inválidas.
 */
public class InvalidCredentialsException extends DomainException {
    
    public InvalidCredentialsException() {
        super("AUTH_INVALID_CREDENTIALS", "Invalid username or password");
    }
    
    public InvalidCredentialsException(String message) {
        super("AUTH_INVALID_CREDENTIALS", message);
    }
}
