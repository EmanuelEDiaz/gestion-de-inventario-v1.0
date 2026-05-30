package com.inventory.adapters.web.controller.user;

import com.inventory.application.user.dto.UserImageDto;
import com.inventory.application.mapper.SupplementaryApplicationMapper;
import com.inventory.application.service.UserImageService;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.net.URI;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users/{userId}")
public class UserImageController {

    private final UserImageService userImageService;
    private final SupplementaryApplicationMapper mapper;

    public UserImageController(UserImageService userImageService,
                               SupplementaryApplicationMapper mapper) {
        this.userImageService = userImageService;
        this.mapper = mapper;
    }

    @GetMapping("/images")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'SELLER') || hasAuthority('users:read')")
    public Mono<UserImageDto> getByUser(@PathVariable UUID userId) {
        return userImageService.getByUserId(userId).map(mapper::toDto);
    }

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') || #userId.toString() == authentication.name || hasAuthority('users:update')")
    public Mono<UserImageDto> upload(
        @PathVariable UUID userId,
        @RequestPart("file") FilePart file
    ) {
        return readBytes(file)
            .flatMap(bytes -> userImageService.upload(
                userId,
                bytes,
                file.filename(),
                file.headers().getContentType() == null
                    ? "application/octet-stream"
                    : file.headers().getContentType().toString()
            ))
            .map(mapper::toDto);
    }

    @DeleteMapping("/images/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') || #userId.toString() == authentication.name || hasAuthority('users:delete')")
    public Mono<Void> delete(
        @PathVariable UUID userId,
        @PathVariable UUID imageId
    ) {
        return userImageService.delete(imageId);
    }

    @GetMapping("/avatar")
    @PreAuthorize("permitAll()")
    public Mono<Void> getAvatar(@PathVariable UUID userId, ServerHttpResponse response) {
        return userImageService.getByUserId(userId)
            .flatMap(img -> {
                response.setStatusCode(HttpStatus.FOUND);
                response.getHeaders().setLocation(URI.create("/media/" + img.filePath()));
                return response.setComplete();
            })
            .switchIfEmpty(Mono.defer(() -> {
                response.setStatusCode(HttpStatus.NOT_FOUND);
                return response.setComplete();
            }));
    }

    private Mono<byte[]> readBytes(FilePart file) {
        return DataBufferUtils.join(file.content())
            .map(dataBuffer -> {
                byte[] bytes = new byte[dataBuffer.readableByteCount()];
                dataBuffer.read(bytes);
                DataBufferUtils.release(dataBuffer);
                return bytes;
            });
    }
}
