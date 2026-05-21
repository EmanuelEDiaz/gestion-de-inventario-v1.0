package com.inventory.domain.ports.in;

import com.inventory.domain.model.user.User;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface AdminUserCommandPort {

    Mono<User> createUser(CreateUserCommand command);

    Mono<User> updateUser(UUID id, UpdateUserCommand command);

    Mono<Void> deactivateUser(UUID id);

    Mono<Void> changePassword(UUID id, ChangePasswordCommand command);

    // ===== Command Records =====

    record CreateUserCommand(
        String username,
        String email,
        String password,
        String displayName,
        UUID roleId
    ) {}

    record UpdateUserCommand(
        String email,
        String displayName,
        UUID roleId,
        Boolean isActive
    ) {}

    record ChangePasswordCommand(
        String currentPassword,
        String newPassword,
        boolean isAdminReset
    ) {}
}
