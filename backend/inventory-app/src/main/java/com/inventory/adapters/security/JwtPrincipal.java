package com.inventory.adapters.security;

import java.util.Collections;
import java.util.List;

/**
 * Principal que representa al usuario autenticado vía JWT.
 * Contiene la información extraída del token.
 */
public record JwtPrincipal(
    String userId,
    String username,
    String role,
    String roleId,
    List<String> permissions
) {
    public JwtPrincipal {
        permissions = permissions != null ? Collections.unmodifiableList(permissions) : Collections.emptyList();
    }
    
    /**
     * Verifica si el principal tiene un permiso específico.
     */
    public boolean hasPermission(String permission) {
        return permissions.contains(permission);
    }
}
