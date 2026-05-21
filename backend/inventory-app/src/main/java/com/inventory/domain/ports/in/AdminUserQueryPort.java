package com.inventory.domain.ports.in;

import com.inventory.domain.model.user.User;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface AdminUserQueryPort {

    Flux<User> findAll();

    Mono<User> findById(UUID id);
}
