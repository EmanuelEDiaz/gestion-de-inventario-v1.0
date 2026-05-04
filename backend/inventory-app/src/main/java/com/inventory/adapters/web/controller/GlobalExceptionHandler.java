package com.inventory.adapters.web.controller;

import com.inventory.adapters.web.dto.ProblemDetail;
import com.inventory.domain.errors.DomainException;
import com.inventory.domain.errors.InvalidCredentialsException;
import com.inventory.domain.errors.InvalidTokenException;
import com.inventory.domain.errors.UserDisabledException;
import com.inventory.domain.errors.UserNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Manejador global de excepciones.
 * Retorna respuestas en formato application/problem+json (RFC 7807).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(InvalidCredentialsException.class)
    public Mono<ResponseEntity<ProblemDetail>> handleInvalidCredentials(
            InvalidCredentialsException ex, ServerWebExchange exchange) {
        log.warn("Invalid credentials attempt: {}", ex.getMessage());
        
        ProblemDetail problem = ProblemDetail.of(
                "urn:inventory:error:invalid-credentials",
                HttpStatus.UNAUTHORIZED.value(),
                "Authentication Failed",
                "Invalid username or password",
                exchange.getRequest().getPath().value()
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .header("Content-Type", "application/problem+json")
                .body(problem));
    }
    
    @ExceptionHandler(UserDisabledException.class)
    public Mono<ResponseEntity<ProblemDetail>> handleUserDisabled(
            UserDisabledException ex, ServerWebExchange exchange) {
        log.warn("Disabled user login attempt: {}", ex.getMessage());
        
        ProblemDetail problem = ProblemDetail.of(
                "urn:inventory:error:user-disabled",
                HttpStatus.FORBIDDEN.value(),
                "Account Disabled",
                "Your account has been disabled. Contact an administrator.",
                exchange.getRequest().getPath().value()
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN)
                .header("Content-Type", "application/problem+json")
                .body(problem));
    }
    
    @ExceptionHandler(InvalidTokenException.class)
    public Mono<ResponseEntity<ProblemDetail>> handleInvalidToken(
            InvalidTokenException ex, ServerWebExchange exchange) {
        log.debug("Invalid token: {}", ex.getMessage());
        
        ProblemDetail problem = ProblemDetail.of(
                "urn:inventory:error:invalid-token",
                HttpStatus.UNAUTHORIZED.value(),
                "Invalid Token",
                ex.getMessage(),
                exchange.getRequest().getPath().value()
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .header("Content-Type", "application/problem+json")
                .body(problem));
    }
    
    @ExceptionHandler(UserNotFoundException.class)
    public Mono<ResponseEntity<ProblemDetail>> handleUserNotFound(
            UserNotFoundException ex, ServerWebExchange exchange) {
        log.warn("User not found: {}", ex.getMessage());
        
        ProblemDetail problem = ProblemDetail.of(
                "urn:inventory:error:user-not-found",
                HttpStatus.NOT_FOUND.value(),
                "User Not Found",
                ex.getMessage(),
                exchange.getRequest().getPath().value()
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND)
                .header("Content-Type", "application/problem+json")
                .body(problem));
    }
    
    @ExceptionHandler(WebExchangeBindException.class)
    public Mono<ResponseEntity<ProblemDetail>> handleValidation(
            WebExchangeBindException ex, ServerWebExchange exchange) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("Validation failed");
        
        ProblemDetail problem = ProblemDetail.of(
                "urn:inventory:error:validation",
                HttpStatus.BAD_REQUEST.value(),
                "Validation Error",
                detail,
                exchange.getRequest().getPath().value()
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .header("Content-Type", "application/problem+json")
                .body(problem));
    }
    
    @ExceptionHandler(DomainException.class)
    public Mono<ResponseEntity<ProblemDetail>> handleDomainException(
            DomainException ex, ServerWebExchange exchange) {
        log.error("Domain exception: {}", ex.getMessage());
        
        ProblemDetail problem = ProblemDetail.of(
                "urn:inventory:error:" + ex.getErrorCode().toLowerCase().replace("_", "-"),
                HttpStatus.BAD_REQUEST.value(),
                "Domain Error",
                ex.getMessage(),
                exchange.getRequest().getPath().value()
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .header("Content-Type", "application/problem+json")
                .body(problem));
    }
    
    @ExceptionHandler(ResponseStatusException.class)
    public Mono<ResponseEntity<ProblemDetail>> handleResponseStatus(
            ResponseStatusException ex, ServerWebExchange exchange) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        if (status == null) status = HttpStatus.INTERNAL_SERVER_ERROR;

        // Para recursos estáticos (404) no loguear como error
        if (status == HttpStatus.NOT_FOUND) {
            log.debug("Resource not found: {}", exchange.getRequest().getPath().value());
        } else {
            log.warn("ResponseStatusException {}: {}", status, ex.getReason());
        }

        ProblemDetail problem = ProblemDetail.of(
                "urn:inventory:error:" + status.name().toLowerCase().replace("_", "-"),
                status.value(),
                status.getReasonPhrase(),
                ex.getReason() != null ? ex.getReason() : status.getReasonPhrase(),
                exchange.getRequest().getPath().value()
        );

        return Mono.just(ResponseEntity.status(status)
                .header("Content-Type", "application/problem+json")
                .body(problem));
    }

    @ExceptionHandler(Exception.class)
    public Mono<ResponseEntity<ProblemDetail>> handleGeneric(
            Exception ex, ServerWebExchange exchange) {
        log.error("Unexpected error: ", ex);
        
        ProblemDetail problem = ProblemDetail.of(
                "urn:inventory:error:internal",
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "An unexpected error occurred. Please try again later.",
                exchange.getRequest().getPath().value()
        );
        
        return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .header("Content-Type", "application/problem+json")
                .body(problem));
    }
}
