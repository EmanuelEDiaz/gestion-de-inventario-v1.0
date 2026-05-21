package com.inventory.adapters.web.controller.user;

import com.inventory.adapters.web.dto.UserDirectoryEntry;
import com.inventory.domain.ports.in.user.AdminUserQueryPort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

/**
 * Directorio público de usuarios — accesible a cualquier usuario autenticado (SELLER, MANAGER, ADMIN).
 * Separado de UserController para evitar que el @PreAuthorize("hasRole('ADMIN')") de clase bloquee el acceso.
 */
@RestController
@RequestMapping("/api/v1/users/directory")
@PreAuthorize("isAuthenticated()")
public class UserDirectoryController {

    private final AdminUserQueryPort userQuery;

    public UserDirectoryController(AdminUserQueryPort userQuery) {
        this.userQuery = userQuery;
    }

    @GetMapping
    public Flux<UserDirectoryEntry> getDirectory() {
        return userQuery.findAll()
            .filter(u -> u.isActive())
            .map(u -> new UserDirectoryEntry(u.getId(), u.getDisplayName(), u.getUsername()));
    }
}
