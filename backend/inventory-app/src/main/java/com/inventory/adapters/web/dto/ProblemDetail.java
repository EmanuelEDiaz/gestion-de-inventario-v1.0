package com.inventory.adapters.web.dto;

import java.time.Instant;
import java.util.List;

public record ProblemDetail(
    String type,
    String title,
    int status,
    String detail,
    String instance,
    Instant timestamp,
    List<FieldErrorDetail> fieldErrors
) {
    public static ProblemDetail of(int status, String title, String detail, String instance) {
        return new ProblemDetail(
                "about:blank",
                title,
                status,
                detail,
                instance,
                Instant.now(),
                null
        );
    }

    public static ProblemDetail of(String type, int status, String title, String detail, String instance) {
        return new ProblemDetail(
                type,
                title,
                status,
                detail,
                instance,
                Instant.now(),
                null
        );
    }

    public static ProblemDetail withFieldErrors(int status, String title, String detail, String instance, List<FieldErrorDetail> fieldErrors) {
        return new ProblemDetail(
                "about:blank",
                title,
                status,
                detail,
                instance,
                Instant.now(),
                fieldErrors
        );
    }

    public static ProblemDetail withFieldErrors(String type, int status, String title, String detail, String instance, List<FieldErrorDetail> fieldErrors) {
        return new ProblemDetail(
                type,
                title,
                status,
                detail,
                instance,
                Instant.now(),
                fieldErrors
        );
    }
}
