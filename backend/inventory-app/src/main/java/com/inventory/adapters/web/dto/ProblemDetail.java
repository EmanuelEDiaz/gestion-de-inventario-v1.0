package com.inventory.adapters.web.dto;

import java.time.Instant;

/**
 * Response DTO para errores siguiendo RFC 7807 (Problem Details).
 */
public record ProblemDetail(
    String type,
    String title,
    int status,
    String detail,
    String instance,
    Instant timestamp
) {
    public static ProblemDetail of(int status, String title, String detail, String instance) {
        return new ProblemDetail(
                "about:blank",
                title,
                status,
                detail,
                instance,
                Instant.now()
        );
    }
    
    public static ProblemDetail of(String type, int status, String title, String detail, String instance) {
        return new ProblemDetail(
                type,
                title,
                status,
                detail,
                instance,
                Instant.now()
        );
    }
}
