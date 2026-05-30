package com.inventory.adapters.persistence.adapter.repository;

import com.inventory.adapters.persistence.adapter.entity.UserImageEntity;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface R2dbcUserImageRepository extends ReactiveCrudRepository<UserImageEntity, UUID> {

    @Query("SELECT * FROM user_images WHERE user_id = :userId")
    Mono<UserImageEntity> findByUserId(UUID userId);

    @Query("DELETE FROM user_images WHERE user_id = :userId")
    Mono<Void> deleteByUserId(UUID userId);
}
