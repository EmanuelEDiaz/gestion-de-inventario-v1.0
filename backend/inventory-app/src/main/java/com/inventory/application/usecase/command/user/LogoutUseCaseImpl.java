package com.inventory.application.usecase.command.user;

import com.inventory.application.usecase.LogoutUseCase;
import com.inventory.domain.ports.out.RefreshTokenRepositoryPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Implementación del caso de uso de logout.
 */
@Service
public class LogoutUseCaseImpl implements LogoutUseCase {
    
    private final RefreshTokenRepositoryPort refreshTokenRepository;
    private final JwtTokenService jwtTokenService;
    
    public LogoutUseCaseImpl(RefreshTokenRepositoryPort refreshTokenRepository,
                             JwtTokenService jwtTokenService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtTokenService = jwtTokenService;
    }
    
    @Override
    public Mono<Void> execute(String refreshToken) {
        String tokenHash = jwtTokenService.hashRefreshToken(refreshToken);
        
        return refreshTokenRepository.findByTokenHash(tokenHash)
                .flatMap(token -> refreshTokenRepository.revoke(token.getId()))
                .then();
    }
    
    @Override
    public Mono<Void> executeAll(UUID userId) {
        return refreshTokenRepository.revokeAllByUserId(userId);
    }
}
