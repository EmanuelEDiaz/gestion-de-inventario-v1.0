package com.inventory.adapters.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.SecurityWebFiltersOrder;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.context.NoOpServerSecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import reactor.core.publisher.Mono;

import java.util.List;

/**
 * Configuración de seguridad para WebFlux.
 * Stateless con JWT, sin sesiones.
 */
@Configuration
@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfig {
    
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    
    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }
    
    @Bean
    public SecurityWebFilterChain securityFilterChain(ServerHttpSecurity http) {
        return http
                // Habilitar CORS
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                
                // Deshabilitar CSRF (stateless con JWT)
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                
                // Sin sesiones (stateless)
                .securityContextRepository(NoOpServerSecurityContextRepository.getInstance())
                
                // Configurar rutas públicas y protegidas
                .authorizeExchange(exchanges -> exchanges
                        // Endpoints públicos (auth)
                        .pathMatchers("/api/v1/auth/login", "/api/v1/auth/refresh").permitAll()
                        
                        // Actuator health (para health checks)
                        .pathMatchers("/actuator/health").permitAll()
                        
                        // OpenAPI/Swagger (solo en desarrollo)
                        .pathMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                        
                        // Todos los demás endpoints requieren autenticación
                        .anyExchange().authenticated()
                )
                
                // Agregar filtro JWT antes del filtro de autenticación
                .addFilterAt(jwtAuthenticationFilter, SecurityWebFiltersOrder.AUTHENTICATION)
                
                // Manejo de excepciones
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((exchange, ex) -> 
                            Mono.fromRunnable(() -> 
                                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED)
                            )
                        )
                        .accessDeniedHandler((exchange, denied) -> 
                            Mono.fromRunnable(() -> 
                                exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN)
                            )
                        )
                )
                
                .build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Orígenes permitidos (frontend dev)
        config.setAllowedOrigins(List.of("http://localhost:3000", "http://127.0.0.1:3000"));
        // Métodos permitidos
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        // Headers permitidos
        config.setAllowedHeaders(List.of("*"));
        // Permitir credenciales (cookies, auth headers)
        config.setAllowCredentials(true);
        // Cache preflight
        config.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        // bcrypt con cost 12 como especifica CLAUDE.md
        return new BCryptPasswordEncoder(12);
    }
}
