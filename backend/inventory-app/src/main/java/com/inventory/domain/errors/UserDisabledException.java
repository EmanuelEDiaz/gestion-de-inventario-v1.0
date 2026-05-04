package com.inventory.domain.errors;

/**
 * Excepción lanzada cuando un usuario está desactivado.
 */
public class UserDisabledException extends DomainException {
    
    public UserDisabledException(String username) {
        super("USER_DISABLED", "User account is disabled: " + username);
    }
}
