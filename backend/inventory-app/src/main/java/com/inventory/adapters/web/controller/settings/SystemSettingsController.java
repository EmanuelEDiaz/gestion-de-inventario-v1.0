package com.inventory.adapters.web.controller.settings;

import com.inventory.application.dto.settings.SystemSettingResponse;
import com.inventory.application.service.SettingsValidator;
import com.inventory.application.service.SystemSettingsService;
import com.inventory.adapters.web.shared.AuditSerializerImpl;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/settings")
public class SystemSettingsController {

    private final SystemSettingsService settingsService;
    private final SettingsValidator validator;

    public SystemSettingsController(SystemSettingsService settingsService,
                                     SettingsValidator validator) {
        this.settingsService = settingsService;
        this.validator = validator;
    }

    @GetMapping("/system")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('settings:read')")
    public Flux<SystemSettingResponse> getAll() {
        return settingsService.getAll();
    }

    @PutMapping("/system/{key}")
    @PreAuthorize("hasRole('ADMIN') || hasAuthority('settings:write')")
    public Mono<Void> update(
            @PathVariable String key,
            @RequestBody UpdateSettingRequest request,
            @AuthenticationPrincipal UserDetails user) {
        UUID userId = extractUserId(user);
        return settingsService.getAll()
            .filter(s -> s.key().equals(key))
            .next()
            .flatMap(s -> {
                validator.validate(key, request.value(), s.valueType());
                return settingsService.update(key, request.value(), userId);
            });
    }

    @GetMapping("/public")
    public Flux<SystemSettingResponse> getPublic() {
        return settingsService.getAll()
            .filter(SystemSettingResponse::isPublic);
    }

    private UUID extractUserId(UserDetails user) {
        if (user == null) return null;
        try {
            return UUID.fromString(user.getUsername());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    public record UpdateSettingRequest(String value) {}
}
