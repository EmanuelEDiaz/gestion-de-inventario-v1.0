package com.inventory.application.usecase.command.user;

import com.inventory.application.user.dto.AuthResult;
import com.inventory.application.user.dto.RefreshTokenCommand;
import com.inventory.application.usecase.RefreshTokenUseCase;
import com.inventory.domain.errors.InvalidTokenException;
import com.inventory.domain.errors.UserNotFoundException;
import com.inventory.domain.model.user.RefreshToken;
import com.inventory.domain.model.user.User;
import com.inventory.domain.ports.out.RefreshTokenRepositoryPort;
import com.inventory.domain.ports.out.UserRepositoryPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

/**
 * Implementación del caso de uso de refresh token.
 */
@Service
public class RefreshTokenUseCaseImpl implements RefreshTokenUseCase {
    
    private static final Duration REFRESH_TOKEN_VALIDITY = Duration.ofDays(7);
    
    private final RefreshTokenRepositoryPort refreshTokenRepository;
    private final UserRepositoryPort userRepository;
    private final JwtTokenService jwtTokenService;
    
    public RefreshTokenUseCaseImpl(RefreshTokenRepositoryPort refreshTokenRepository,
                                    UserRepositoryPort userRepository,
                                    JwtTokenService jwtTokenService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.jwtTokenService = jwtTokenService;
    }
    
    @Override
    public Mono<AuthResult> execute(RefreshTokenCommand command) {
        String tokenHash = jwtTokenService.hashRefreshToken(command.refreshToken());
        
        return refreshTokenRepository.findByTokenHash(tokenHash)
                .switchIfEmpty(Mono.error(new InvalidTokenException()))
                .flatMap(this::validateToken)
                .flatMap(this::rotateTokenAndGenerateResult);
    }
    
    private Mono<RefreshToken> validateToken(RefreshToken token) {
        if (!token.isValid()) {
            return Mono.error(new InvalidTokenException());
        }
        return Mono.just(token);
    }
    
    private Mono<AuthResult> rotateTokenAndGenerateResult(RefreshToken oldToken) {
        // Revocar el token viejo
        return refreshTokenRepository.revoke(oldToken.getId())
                .then(userRepository.findById(oldToken.getUserId()))
                .switchIfEmpty(Mono.error(new UserNotFoundException(oldToken.getUserId().toString())))
                .flatMap(this::createNewTokenAndResult);
    }
    
    private Mono<AuthResult> createNewTokenAndResult(User user) {
        // Crear nuevo refresh token (rotación)
        String rawRefreshToken = UUID.randomUUID().toString();
        String tokenHash = jwtTokenService.hashRefreshToken(rawRefreshToken);
        
        RefreshToken newToken = RefreshToken.create(
                user.getId(),
                tokenHash,
                Instant.now().plus(REFRESH_TOKEN_VALIDITY)
        );
        
        return refreshTokenRepository.save(newToken)
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
