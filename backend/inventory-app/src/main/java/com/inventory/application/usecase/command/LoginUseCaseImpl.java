package com.inventory.application.usecase.command;

import com.inventory.application.user.dto.AuthResult;
import com.inventory.application.user.dto.LoginCommand;
import com.inventory.application.usecase.LoginUseCase;
import com.inventory.domain.errors.InvalidCredentialsException;
import com.inventory.domain.errors.UserDisabledException;
import com.inventory.domain.model.user.RefreshToken;
import com.inventory.domain.model.user.User;
import com.inventory.domain.ports.out.RefreshTokenRepositoryPort;
import com.inventory.domain.ports.out.UserRepositoryPort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Implementación del caso de uso de login.
 */
@Service
public class LoginUseCaseImpl implements LoginUseCase {
    
    private static final Duration REFRESH_TOKEN_VALIDITY = Duration.ofDays(7);
    
    private final UserRepositoryPort userRepository;
    private final RefreshTokenRepositoryPort refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;
    
    public LoginUseCaseImpl(UserRepositoryPort userRepository,
                            RefreshTokenRepositoryPort refreshTokenRepository,
                            PasswordEncoder passwordEncoder,
                            JwtTokenService jwtTokenService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenService = jwtTokenService;
    }
    
    @Override
    public Mono<AuthResult> execute(LoginCommand command) {
        return userRepository.findByUsername(command.username())
                .switchIfEmpty(Mono.error(new InvalidCredentialsException()))
                .flatMap(user -> validateUser(user, command))
                .flatMap(this::createAuthResult);
    }
    
    private Mono<User> validateUser(User user, LoginCommand command) {
        if (!user.isActive()) {
            return Mono.error(new UserDisabledException(user.getUsername()));
        }
        
        if (!passwordEncoder.matches(command.password(), user.getPasswordHash())) {
            return Mono.error(new InvalidCredentialsException());
        }
        
        return Mono.just(user);
    }
    
    private Mono<AuthResult> createAuthResult(User user) {
        // Generar refresh token
        String rawRefreshToken = UUID.randomUUID().toString();
        String tokenHash = jwtTokenService.hashRefreshToken(rawRefreshToken);
        
        RefreshToken refreshToken = RefreshToken.create(
                user.getId(),
                tokenHash,
                Instant.now().plus(REFRESH_TOKEN_VALIDITY)
        );
        
        return refreshTokenRepository.save(refreshToken)
                .then(Mono.fromCallable(() -> buildAuthResult(user, rawRefreshToken)));
    }
    
    private AuthResult buildAuthResult(User user, String refreshToken) {
        String accessToken = jwtTokenService.generateAccessToken(user);
        long expiresIn = jwtTokenService.getAccessTokenValiditySeconds();
        
        return new AuthResult(
                accessToken,
                refreshToken,
                expiresIn,
                new AuthResult.UserInfo(
                        user.getId(),
                        user.getUsername(),
                        user.getDisplayName(),
                        user.getEmail(),
                        new AuthResult.RoleInfo(
                                user.getRole().getId(),
                                user.getRole().getCode(),
                                user.getRole().getName(),
                                user.getRole().getPermissionCodes()
                        )
                )
        );
    }
}
