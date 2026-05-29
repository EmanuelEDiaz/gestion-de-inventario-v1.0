package com.inventory.adapters.persistence.adapter;

import com.inventory.adapters.persistence.adapter.entity.ImportJobEntity;
import com.inventory.adapters.persistence.adapter.mapper.ImportJobPersistenceMapper;
import com.inventory.adapters.persistence.adapter.repository.ImportJobR2dbcRepository;
import com.inventory.domain.model.importjob.ImportJob;
import com.inventory.domain.ports.out.ImportJobRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Repository
public class ImportJobRepositoryAdapter implements ImportJobRepository {

    private final ImportJobR2dbcRepository r2dbcRepository;
    private final ImportJobPersistenceMapper mapper;

    public ImportJobRepositoryAdapter(ImportJobR2dbcRepository r2dbcRepository,
                                      ImportJobPersistenceMapper mapper) {
        this.r2dbcRepository = r2dbcRepository;
        this.mapper = mapper;
    }

    @Override
    public Mono<Void> save(ImportJob job) {
        ImportJobEntity entity = mapper.toEntity(job);
        return r2dbcRepository.save(entity).then();
    }

    @Override
    public Mono<ImportJob> findById(UUID id) {
        return r2dbcRepository.findById(id)
            .map(mapper::toDomain);
    }
}
