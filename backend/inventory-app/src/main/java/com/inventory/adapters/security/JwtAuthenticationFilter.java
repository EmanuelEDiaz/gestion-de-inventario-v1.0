package com.inventory.adapters.security;

import io.jsonwebtoken.Claims;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebFilter;
import org.springframework.web.server.WebFilterChain;
import reactor.core.publisher.Mono;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Filtro WebFlux que extrae y valida el token JWT de cada solicitud.
 */
@Component
public class JwtAuthenticationFilter implements WebFilter {
    
    private static final String BEARER_PREFIX = "Bearer ";
    
    private final JwtTokenServiceImpl jwtTokenService;
    
    public JwtAuthenticationFilter(JwtTokenServiceImpl jwtTokenService) {
        this.jwtTokenService = jwtTokenService;
    }
    
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, WebFilterChain chain) {
        String token = extractToken(exchange.getRequest());
        
        if (token == null) {
            return chain.filter(exchange);
        }
        
        try {
            Claims claims = jwtTokenService.extractClaims(token);
            Authentication auth = createAuthentication(claims);
            
            return chain.filter(exchange)
                    .contextWrite(ReactiveSecurityContextHolder.withAuthentication(auth));
        } catch (Exception e) {
            // Token inválido - continuar sin autenticación
            return chain.filter(exchange);
        }
    }
    
    private String extractToken(ServerHttpRequest request) {
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        
        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            return authHeader.substring(BEARER_PREFIX.length());
        }
        
        return null;
    }
    
    private Authentication createAuthentication(Claims claims) {
        String username = claims.getSubject();
        String role = claims.get("role", String.class);
        String permissionsStr = claims.get("permissions", String.class);
        
        List<SimpleGrantedAuthority> authorities = buildAuthorities(role, permissionsStr);
        
        JwtPrincipal principal = new JwtPrincipal(
                claims.get("userId", String.class),
                username,
                role,
                claims.get("roleId", String.class),
                permissionsStr != null ? Arrays.asList(permissionsStr.split(",")) : Collections.emptyList()
        );
        
        return new UsernamePasswordAuthenticationToken(principal, null, authorities);
    }
    
    private List<SimpleGrantedAuthority> buildAuthorities(String role, String permissionsStr) {
        List<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>();
        
        // Agregar rol como authority
        if (role != null) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
        }
        
        // Agregar permisos como authorities
        if (permissionsStr != null && !permissionsStr.isBlank()) {
            Arrays.stream(permissionsStr.split(","))
                    .map(String::trim)
                    .filter(p -> !p.isEmpty())
                    .map(SimpleGrantedAuthority::new)
                    .forEach(authorities::add);
        }
        
        return authorities;
    }
}
