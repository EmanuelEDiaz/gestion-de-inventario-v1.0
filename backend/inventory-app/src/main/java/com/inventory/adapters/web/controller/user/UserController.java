package com.inventory.adapters.web.controller.user;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.inventory.adapters.persistence.adapter.repository.UserR2dbcRepository;
import com.inventory.adapters.web.dto.user.ChangePasswordRequest;
import com.inventory.adapters.web.dto.user.CreateUserRequest;
import com.inventory.adapters.web.dto.role.PermissionResponse;
import com.inventory.adapters.web.dto.role.RoleResponse;
import com.inventory.adapters.web.dto.user.UpdateUserRequest;
import com.inventory.adapters.web.dto.user.UserResponse;
import com.inventory.application.service.UserImageService;
import com.inventory.domain.model.role.Role;
import com.inventory.domain.model.user.User;
import com.inventory.domain.ports.in.user.AdminUserCommandPort;
import com.inventory.domain.ports.in.user.AdminUserQueryPort;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@PreAuthorize("hasRole('ADMIN') || hasAuthority('users:read')")
public class UserController {

    private final AdminUserQueryPort userQuery;
    private final AdminUserCommandPort userCommand;
    private final UserImageService userImageService;
    private final UserR2dbcRepository userRepository;
    private final ObjectMapper objectMapper;

    public UserController(AdminUserQueryPort userQuery,
                          AdminUserCommandPort userCommand,
                          UserImageService userImageService,
                          UserR2dbcRepository userRepository,
                          ObjectMapper objectMapper) {
        this.userQuery   = userQuery;
        this.userCommand = userCommand;
        this.userImageService = userImageService;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public Flux<UserResponse> getAll() {
        return userQuery.findAll()
            .flatMap(this::enrichWithAvatar);
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<UserResponse>> getById(@PathVariable UUID id) {
        return userQuery.findById(id)
            .flatMap(user -> enrichWithAvatar(user)
                .map(resp -> ResponseEntity.ok(resp)))
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Mono<ResponseEntity<UserResponse>> create(@Valid @RequestBody CreateUserRequest request) {
        var command = new AdminUserCommandPort.CreateUserCommand(
            request.username(), request.email(), request.password(),
            request.displayName(), request.roleId()
        );
        return userCommand.createUser(command)
            .map(saved -> ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved, null)));
    }

    @PatchMapping("/{id}")
    public Mono<ResponseEntity<UserResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request) {
        var command = new AdminUserCommandPort.UpdateUserCommand(
            request.email(), request.displayName(), request.roleId(), request.isActive()
        );
        return userCommand.updateUser(id, command)
            .map(updated -> ResponseEntity.ok(toResponse(updated, null)));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> deactivate(@PathVariable UUID id) {
        return userCommand.deactivateUser(id)
            .thenReturn(ResponseEntity.<Void>noContent().build());
    }

    @GetMapping("/me/preferences")
    @PreAuthorize("isAuthenticated()")
    public Mono<ResponseEntity<Map<String, Object>>> getMyPreferences(
            @AuthenticationPrincipal UserDetails user) {
        UUID userId = extractUserId(user);
        if (userId == null) return Mono.just(ResponseEntity.badRequest().build());
        return userRepository.findById(userId)
            .map(entity -> parsePreferences(entity.getPreferences()))
            .defaultIfEmpty(ResponseEntity.ok(Map.of()));
    }

    @PutMapping("/me/preferences")
    @PreAuthorize("isAuthenticated()")
    public Mono<ResponseEntity<Void>> updateMyPreferences(
            @RequestBody Map<String, Object> preferences,
            @AuthenticationPrincipal UserDetails user) {
        UUID userId = extractUserId(user);
        if (userId == null) return Mono.just(ResponseEntity.badRequest().build());
        try {
            String json = objectMapper.writeValueAsString(preferences);
            return userRepository.updatePreferences(userId, json)
                .map(count -> ResponseEntity.ok().<Void>build())
                .defaultIfEmpty(ResponseEntity.notFound().build());
        } catch (JsonProcessingException e) {
            return Mono.just(ResponseEntity.badRequest().build());
        }
    }

    @PatchMapping("/{id}/password")
    public Mono<ResponseEntity<Void>> changePassword(
            @PathVariable UUID id,
            @Valid @RequestBody ChangePasswordRequest request) {
        var command = new AdminUserCommandPort.ChangePasswordCommand(
            request.currentPassword(), request.newPassword(), true
        );
        return userCommand.changePassword(id, command)
            .thenReturn(ResponseEntity.<Void>noContent().<Void>build());
    }

    private Mono<UserResponse> enrichWithAvatar(User u) {
        return userImageService.getByUserId(u.getId())
            .map(img -> toResponse(u, "/api/v1/users/" + u.getId() + "/avatar"))
            .defaultIfEmpty(toResponse(u, null));
    }

    private UserResponse toResponse(User u, String avatarUrl) {
        return new UserResponse(
            u.getId(), u.getUsername(), u.getEmail(), u.getDisplayName(),
            toRoleResponse(u.getRole()),
            u.isActive(), avatarUrl, u.getCreatedAt(), u.getUpdatedAt()
        );
    }

    @SuppressWarnings("unchecked")
    private ResponseEntity<Map<String, Object>> parsePreferences(String json) {
        try {
            return ResponseEntity.ok(objectMapper.readValue(json, Map.class));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of());
        }
    }

    private UUID extractUserId(UserDetails user) {
        if (user == null) return null;
        try {
            return UUID.fromString(user.getUsername());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private RoleResponse toRoleResponse(Role role) {
        if (role == null) return null;
        List<PermissionResponse> perms = role.getPermissions().stream()
            .map(p -> new PermissionResponse(p.getId(), p.getCode(), p.getName(), p.getCategory()))
            .toList();
        return new RoleResponse(
            role.getId(), role.getCode(), role.getName(), role.getDescription(),
            role.isSystem(), role.isActive(), perms, role.getCreatedAt(), role.getUpdatedAt()
        );
    }
}
