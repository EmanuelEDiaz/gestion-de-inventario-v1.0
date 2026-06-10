package com.inventory.adapters.web.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@RestController
@RequestMapping("/api/v1/images")
public class ImageController {

    private static final String PREFIX = "/api/v1/images/";

    @Value("${inventory.media.root:./media}")
    private String mediaRoot;

    @GetMapping("/**")
    public Mono<ResponseEntity<Resource>> serveImage(ServerHttpRequest request) {
        String fullPath = request.getPath().value();
        if (!fullPath.startsWith(PREFIX) || fullPath.length() <= PREFIX.length()) {
            return Mono.just(ResponseEntity.notFound().build());
        }

        String relativePath = fullPath.substring(PREFIX.length());

        if (relativePath.contains("..")) {
            return Mono.just(ResponseEntity.badRequest().build());
        }

        Path filePath = Paths.get(mediaRoot, relativePath).normalize();
        Path mediaRootPath = Paths.get(mediaRoot).normalize();

        if (!filePath.startsWith(mediaRootPath)) {
            return Mono.just(ResponseEntity.badRequest().build());
        }

        Resource resource = new FileSystemResource(filePath.toFile());
        if (!resource.exists() || !resource.isReadable()) {
            return Mono.just(ResponseEntity.notFound().build());
        }

        long lastModified;
        try {
            lastModified = resource.lastModified();
        } catch (Exception e) {
            return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
        }

        String etag = computeEtag(relativePath, lastModified);

        String ifNoneMatch = request.getHeaders().getFirst(HttpHeaders.IF_NONE_MATCH);
        if (ifNoneMatch != null && normalizeEtag(ifNoneMatch).equals(etag)) {
            return Mono.just(ResponseEntity.<Resource>status(HttpStatus.NOT_MODIFIED)
                .eTag(etag)
                .build());
        }

        MediaType mediaType = resolveMediaType(relativePath);

        return Mono.just(ResponseEntity.ok()
            .contentType(mediaType)
            .header(HttpHeaders.CACHE_CONTROL, "private, max-age=86400")
            .eTag(etag)
            .header(HttpHeaders.ACCEPT_RANGES, "bytes")
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
            .body(resource));
    }

    private static String computeEtag(String path, long lastModified) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            digest.update(path.getBytes());
            digest.update(Long.toString(lastModified).getBytes());
            return HexFormat.of().formatHex(digest.digest());
        } catch (NoSuchAlgorithmException e) {
            return Integer.toHexString((path + lastModified).hashCode());
        }
    }

    private static String normalizeEtag(String etag) {
        String normalized = etag.trim();
        if (normalized.startsWith("W/")) {
            normalized = normalized.substring(2);
        }
        if (normalized.startsWith("\"") && normalized.endsWith("\"")) {
            normalized = normalized.substring(1, normalized.length() - 1);
        }
        return normalized;
    }

    private static MediaType resolveMediaType(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return MediaType.IMAGE_JPEG;
        } else if (lower.endsWith(".png")) {
            return MediaType.IMAGE_PNG;
        } else if (lower.endsWith(".webp")) {
            return MediaType.parseMediaType("image/webp");
        } else if (lower.endsWith(".gif")) {
            return MediaType.IMAGE_GIF;
        } else if (lower.endsWith(".svg") || lower.endsWith(".svgz")) {
            return MediaType.parseMediaType("image/svg+xml");
        } else if (lower.endsWith(".avif")) {
            return MediaType.parseMediaType("image/avif");
        }
        return MediaType.APPLICATION_OCTET_STREAM;
    }
}
