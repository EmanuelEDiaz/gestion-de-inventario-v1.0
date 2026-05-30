package com.inventory.application.service;

import com.inventory.domain.errors.BadRequestException;
import com.inventory.domain.errors.NotFoundException;
import com.inventory.domain.model.user.UserImage;
import com.inventory.domain.ports.out.UserImageRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class UserImageService {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_SIZE_BYTES = 2 * 1024 * 1024;

    private final UserImageRepository userImageRepository;
    private final ImageProcessingService imageService;

    @Value("${inventory.media.root:./media}")
    private String mediaRoot;

    public UserImageService(UserImageRepository userImageRepository,
                            ImageProcessingService imageService) {
        this.userImageRepository = userImageRepository;
        this.imageService = imageService;
    }

    public Mono<UserImage> upload(UUID userId, byte[] fileData,
                                  String originalFilename, String contentType) {
        if (!ALLOWED_TYPES.contains(contentType)) {
            return Mono.error(new BadRequestException("Tipo de imagen no permitido: " + contentType));
        }
        if (fileData.length > MAX_SIZE_BYTES) {
            return Mono.error(new BadRequestException("El archivo supera 2 MB"));
        }

        return userImageRepository.findByUserId(userId)
            .defaultIfEmpty(null)
            .flatMap(existing -> {
                try {
                    String filePath = imageService.processAndSaveUser(
                        userId, fileData, originalFilename, contentType
                    );

                    UserImage image = UserImage.create(
                        userId, contentType, filePath, originalFilename, fileData.length
                    );

                    Mono<Void> deleteOldDb = existing != null
                        ? userImageRepository.deleteById(existing.id())
                        : Mono.empty();

                    return deleteOldDb
                        .then(userImageRepository.save(image))
                        .map(saved -> {
                            if (existing != null && !existing.id().equals(saved.id())) {
                                deleteFileFromDisk(existing);
                            }
                            return saved;
                        });
                } catch (IOException e) {
                    return Mono.error(new BadRequestException("Error al procesar imagen: " + e.getMessage()));
                }
            });
    }

    @Transactional
    public Mono<Void> delete(UUID imageId) {
        return userImageRepository.findById(imageId)
            .switchIfEmpty(Mono.error(new NotFoundException("UserImage not found: " + imageId)))
            .flatMap(img -> {
                deleteFileFromDisk(img);
                return userImageRepository.deleteById(imageId);
            });
    }

    public Mono<UserImage> getByUserId(UUID userId) {
        return userImageRepository.findByUserId(userId);
    }

    private void deleteFileFromDisk(UserImage img) {
        try {
            Path filePath = Paths.get(mediaRoot, img.filePath());
            Files.deleteIfExists(filePath);
            Path thumbDir = filePath.getParent().getParent().resolve("thumb");
            if (Files.isDirectory(thumbDir)) {
                try (var files = Files.walk(thumbDir)) {
                    files.filter(Files::isRegularFile)
                        .filter(p -> p.getFileName().toString().contains(img.id().toString()))
                        .forEach(p -> {
                            try { Files.deleteIfExists(p); } catch (IOException ignored) {}
                        });
                }
                try (var dirs = Files.walk(thumbDir)) {
                    dirs.filter(Files::isDirectory)
                        .sorted((a, b) -> b.getNameCount() - a.getNameCount())
                        .forEach(p -> {
                            try { Files.deleteIfExists(p); } catch (IOException ignored) {}
                        });
                }
            }
            Path parent = filePath.getParent();
            if (parent != null) {
                try (var files = Files.list(parent)) {
                    if (files.findAny().isEmpty()) {
                        Files.deleteIfExists(parent);
                    }
                }
            }
        } catch (IOException ignored) {
        }
    }
}
