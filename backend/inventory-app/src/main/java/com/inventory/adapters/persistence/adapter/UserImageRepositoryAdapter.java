package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.mapper.SupplementaryPersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.R2dbcUserImageRepository;
import com.inventory.domain.model.user.UserImage;
import com.inventory.domain.ports.out.UserImageRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class UserImageRepositoryAdapter implements UserImageRepository {

    private final R2dbcUserImageRepository r2dbc;
    private final SupplementaryPersistenceMapper mapper;

    public UserImageRepositoryAdapter(R2dbcUserImageRepository r2dbc,
                                      SupplementaryPersistenceMapper mapper) {
        this.r2dbc = r2dbc;
        this.mapper = mapper;
    }

    @Override
    public Mono<UserImage> findByUserId(UUID userId) {
        return r2dbc.findByUserId(userId).map(mapper::toDomain);
    }

    @Override
    public Mono<UserImage> findById(UUID id) {
        return r2dbc.findById(id).map(mapper::toDomain);
    }

    @Override
    public Mono<UserImage> save(UserImage image) {
        return r2dbc.findById(image.id())
            .flatMap(existing -> r2dbc.save(mapper.toEntity(image, false)))
            .switchIfEmpty(Mono.defer(() -> r2dbc.save(mapper.toEntity(image, true))))
            .map(mapper::toDomain);
    }

    @Override
    public Mono<Void> deleteById(UUID id) {
        return r2dbc.deleteById(id);
    }

    @Override
    public Mono<Void> deleteByUserId(UUID userId) {
        return r2dbc.deleteByUserId(userId);
    }

    @Override
    public Mono<Boolean> existsById(UUID id) {
        return r2dbc.existsById(id);
    }
}
