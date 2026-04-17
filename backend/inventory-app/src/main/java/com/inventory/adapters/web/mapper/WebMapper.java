package com.inventory.adapters.web.mapper;

import com.inventory.adapters.web.dto.AuthResponse;
import com.inventory.application.dto.AuthResult;
import org.springframework.stereotype.Component;

/**
 * Mapper entre DTOs de aplicación y DTOs web.
 */
@Component
public class WebMapper {
    
    public AuthResponse toAuthResponse(AuthResult result) {
        return new AuthResponse(
                result.accessToken(),
                result.refreshToken(),
                "Bearer",
                result.expiresIn(),
                toUserDto(result.user())
        );
    }
    
    private AuthResponse.UserDto toUserDto(AuthResult.UserInfo user) {
        return new AuthResponse.UserDto(
                user.id(),
                user.username(),
                user.displayName(),
                user.email(),
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
