package com.inventory.domain.ports.out;

import com.inventory.domain.model.user.UserImage;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import java.util.UUID;

public interface UserImageRepository {
    Mono<UserImage> findByUserId(UUID userId);
    Mono<UserImage> findById(UUID id);
    Mono<UserImage> save(UserImage image);
    Mono<Void> deleteById(UUID id);
    Mono<Void> deleteByUserId(UUID userId);
    Mono<Boolean> existsById(UUID id);
}
