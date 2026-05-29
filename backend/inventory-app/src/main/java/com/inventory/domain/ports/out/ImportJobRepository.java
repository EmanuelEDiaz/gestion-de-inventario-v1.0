package com.inventory.domain.ports.out;

import com.inventory.domain.model.importjob.ImportJob;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface ImportJobRepository {
    Mono<Void> save(ImportJob job);
    Mono<ImportJob> findById(UUID id);
}
