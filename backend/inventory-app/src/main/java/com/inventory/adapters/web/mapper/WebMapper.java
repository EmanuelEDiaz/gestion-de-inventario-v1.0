package com.inventory.adapters.web.mapper;

import com.inventory.adapters.web.dto.user.AuthResponse;
import com.inventory.application.user.dto.AuthResult;
import org.springframework.stereotype.Component;

/**
 * Mapper entre DTOs de aplicación y DTOs web.
 */
@Component
public class WebMapper {
    
    public AuthResponse toAuthResponse(AuthResult result) {
        return toAuthResponse(result, null);
    }
    
    public AuthResponse toAuthResponse(AuthResult result, String avatarUrl) {
        return new AuthResponse(
                result.accessToken(),
                result.refreshToken(),
                "Bearer",
                result.expiresIn(),
                toUserDto(result.user(), avatarUrl)
        );
    }
    
    private AuthResponse.UserDto toUserDto(AuthResult.UserInfo user, String avatarUrl) {
        return new AuthResponse.UserDto(
                user.id(),
                user.username(),
                user.displayName(),
                user.email(),
                avatarUrl,
                toRoleDto(user.role())
        );
    }
    
    private AuthResponse.RoleDto toRoleDto(AuthResult.RoleInfo role) {
        return new AuthResponse.RoleDto(
                role.id(),
                role.code(),
                role.name(),
                role.permissions()
        );
    }
}
