package com.inventory.application.usecase.query;

import com.inventory.domain.model.user.User;
import com.inventory.domain.ports.in.AdminUserQueryPort;
import com.inventory.domain.ports.out.UserRepositoryPort;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
public class AdminUserQueryUseCase implements AdminUserQueryPort {

    private final UserRepositoryPort userRepository;

    public AdminUserQueryUseCase(UserRepositoryPort userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public Flux<User> findAll() {
        return userRepository.findAll();
    }

    @Override
    public Mono<User> findById(UUID id) {
        return userRepository.findById(id);
    }
}
