package com.inventory.adapters.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
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
) implements UserDetails {
    public JwtPrincipal {
        permissions = permissions != null ? Collections.unmodifiableList(permissions) : Collections.emptyList();
    }

    @Override
    public String getUsername() {
        return userId;
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return permissions.stream()
            .map(SimpleGrantedAuthority::new)
            .toList();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
    
    /**
     * Verifica si el principal tiene un permiso específico.
     */
    public boolean hasPermission(String permission) {
        return permissions.contains(permission);
    }
}
