package com.inventory.adapters.web.controller.user;

import com.inventory.adapters.web.dto.user.AuthResponse;
import com.inventory.adapters.web.dto.user.LoginRequest;
import com.inventory.adapters.web.dto.user.RefreshTokenRequest;
import com.inventory.adapters.web.mapper.WebMapper;
import com.inventory.application.user.dto.LoginCommand;
import com.inventory.application.user.dto.RefreshTokenCommand;
import com.inventory.application.usecase.LoginUseCase;
import com.inventory.application.usecase.LogoutUseCase;
import com.inventory.application.usecase.RefreshTokenUseCase;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

/**
 * Controlador REST para autenticación.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    
    private final LoginUseCase loginUseCase;
    private final RefreshTokenUseCase refreshTokenUseCase;
    private final LogoutUseCase logoutUseCase;
    private final WebMapper mapper;
    
    public AuthController(LoginUseCase loginUseCase,
                          RefreshTokenUseCase refreshTokenUseCase,
                          LogoutUseCase logoutUseCase,
                          WebMapper mapper) {
        this.loginUseCase = loginUseCase;
        this.refreshTokenUseCase = refreshTokenUseCase;
        this.logoutUseCase = logoutUseCase;
        this.mapper = mapper;
    }
    
    /**
     * Autentica un usuario con sus credenciales.
     */
    @PostMapping("/login")
    public Mono<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginCommand command = new LoginCommand(
                request.username(),
                request.password()
        );
        
        return loginUseCase.execute(command)
                .map(mapper::toAuthResponse);
    }
    
    /**
     * Renueva los tokens usando un refresh token válido.
     */
    @PostMapping("/refresh")
    public Mono<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        RefreshTokenCommand command = new RefreshTokenCommand(
                request.refreshToken()
        );
        
        return refreshTokenUseCase.execute(command)
                .map(mapper::toAuthResponse);
    }
    
    /**
     * Cierra la sesión revocando el refresh token.
     */
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        return logoutUseCase.execute(request.refreshToken());
    }
}
