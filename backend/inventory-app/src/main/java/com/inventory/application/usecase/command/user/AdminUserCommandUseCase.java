package com.inventory.application.usecase.command.user;

import com.inventory.domain.model.user.User;
import com.inventory.domain.ports.in.user.AdminUserCommandPort;
import com.inventory.domain.ports.out.RoleRepositoryPort;
import com.inventory.domain.ports.out.UserRepositoryPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

@Service
public class AdminUserCommandUseCase implements AdminUserCommandPort {

    private final UserRepositoryPort userRepository;
    private final RoleRepositoryPort roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUserCommandUseCase(UserRepositoryPort userRepository,
                                    RoleRepositoryPort roleRepository,
                                    PasswordEncoder passwordEncoder) {
        this.userRepository  = userRepository;
        this.roleRepository  = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Mono<User> createUser(CreateUserCommand command) {
        return roleRepository.findById(command.roleId())
            .switchIfEmpty(Mono.error(new IllegalArgumentException("Role not found: " + command.roleId())))
            .flatMap(role -> {
                String hash = passwordEncoder.encode(command.password());
                User user = User.create(command.username(), hash, command.displayName(), command.email(), role);
                return userRepository.save(user);
            });
    }

    @Override
    public Mono<User> updateUser(UUID id, UpdateUserCommand command) {
        return userRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("User not found: " + id)))
            .flatMap(existing -> {
                if (command.roleId() != null) {
                    return roleRepository.findById(command.roleId())
                        .switchIfEmpty(Mono.error(new IllegalArgumentException("Role not found: " + command.roleId())))
                        .flatMap(role -> buildUpdatedUser(existing, command, role));
                }
                return buildUpdatedUser(existing, command, existing.getRole());
            });
    }

    @Override
    public Mono<Void> deactivateUser(UUID id) {
        return userRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("User not found: " + id)))
            .flatMap(u -> userRepository.save(u.deactivate()))
            .then();
    }

    @Override
    public Mono<Void> changePassword(UUID id, ChangePasswordCommand command) {
        return userRepository.findById(id)
            .switchIfEmpty(Mono.error(new IllegalArgumentException("User not found: " + id)))
            .flatMap(existing -> {
                if (!command.isAdminReset() && command.currentPassword() != null) {
                    if (!passwordEncoder.matches(command.currentPassword(), existing.getPasswordHash())) {
                        return Mono.error(new IllegalArgumentException("Contraseña actual incorrecta"));
                    }
                }
                String newHash = passwordEncoder.encode(command.newPassword());
                User updated = new User(
                    existing.getId(), existing.getUsername(), newHash,
                    existing.getDisplayName(), existing.getEmail(), existing.getRole(),
                    existing.isActive(), existing.getCreatedAt(), Instant.now()
                );
                return userRepository.save(updated);
            })
            .then();
    }

    private Mono<User> buildUpdatedUser(User existing, UpdateUserCommand command, com.inventory.domain.model.role.Role role) {
        String email       = command.email()       != null ? command.email()       : existing.getEmail();
        String displayName = command.displayName() != null ? command.displayName() : existing.getDisplayName();
        boolean isActive   = command.isActive()    != null ? command.isActive()    : existing.isActive();

        User updated = new User(
            existing.getId(),
            existing.getUsername(),
            existing.getPasswordHash(),
            displayName,
            email,
            role,
            isActive,
            existing.getCreatedAt(),
            Instant.now()
        );
        return userRepository.save(updated);
    }
}
