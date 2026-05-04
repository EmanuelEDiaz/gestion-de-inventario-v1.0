package com.inventory.domain.errors;

/**
 * Excepción lanzada cuando un usuario no es encontrado.
 */
public class UserNotFoundException extends DomainException {
    
    public UserNotFoundException(String identifier) {
        super("USER_NOT_FOUND", "User not found: " + identifier);
    }
}
